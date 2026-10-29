"""Metered model access. Every call: route → reserve budget → call → settle actual cost.

Structured outputs are always validated with Pydantic. Invalid output gets at most
`max_repair_attempts` repair calls (each metered) before failing explicitly.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ValidationError

from ..billing.budget import BudgetService, BudgetState
from ..config import Settings
from ..errors import AppError
from ..logging_setup import request_id_var
from .base import ChatMessage, ChatProvider, ChatRequest, ChatResult, ImagePart, ProviderError, TextPart
from .catalog import ModelCatalog, ModelSpec, Tier, cost_sgd, estimate_image_tokens, estimate_text_tokens

logger = logging.getLogger(__name__)


class ModelCallFailed(AppError):
    status_code = 502
    code = "model_call_failed"
    message = "Dịch vụ AI đang gặp sự cố. Hãy thử lại sau."

    def __init__(self, message: str | None = None, *, retryable: bool, kind: str,
                 cost_sgd: Decimal = Decimal(0)) -> None:
        super().__init__(message, details={"kind": kind})
        self.retryable = retryable
        self.kind = kind
        self.cost_sgd = cost_sgd  # what the failed attempts cost (already settled in the ledger)


class InvalidModelOutput(AppError):
    status_code = 502
    code = "invalid_model_output"
    message = "AI trả về kết quả không đúng định dạng. Hãy thử lại."
    cost_sgd: Decimal = Decimal(0)  # what the calls cost (already settled in the ledger)
    truncated: bool = False


@dataclass(frozen=True)
class CallContext:
    purpose: str
    user_id: uuid.UUID | None
    job_id: uuid.UUID | None = None


@dataclass(frozen=True)
class StructuredResult[T: BaseModel]:
    value: T
    model: str
    cost_sgd: Decimal
    calls: int


_THINK = re.compile(r"<think>.*?</think>", re.S)
_FENCE = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.S)


def require_all_fields(node: Any) -> Any:
    """Copy of a JSON schema in which every object property is required.

    Optional fields with defaults let a model (and grammar-constrained decoders in particular) emit the
    shortest valid object, e.g. `{"page_kind": "printed"}` with no items. Nullable fields stay nullable.
    """
    if isinstance(node, list):
        return [require_all_fields(v) for v in node]
    if not isinstance(node, dict):
        return node
    copy = {k: require_all_fields(v) for k, v in node.items()}
    if copy.get("type") == "object" and isinstance(copy.get("properties"), dict):
        copy["required"] = list(copy["properties"])
        copy["additionalProperties"] = False
    return copy


def _strip_keys(node: Any, keys: set[str]) -> Any:
    if isinstance(node, dict):
        # Only string annotations are dropped: a *property* named "title" has a dict value and is kept.
        return {k: _strip_keys(v, keys) for k, v in node.items() if k not in keys or not isinstance(v, str)}
    if isinstance(node, list):
        return [_strip_keys(v, keys) for v in node]
    return node


def with_schema_instruction(messages: list[ChatMessage], schema: dict[str, Any]) -> list[ChatMessage]:
    """Put the schema in the prompt for modes where the provider is not given it (json_object, none)."""
    # Titles carry no information and descriptions of very large schemas are repeated in the prompt text:
    # strip them to keep the prompt small (validation still uses the full Pydantic model).
    compact = _strip_keys(schema, {"title", "description"} if len(json.dumps(schema)) > 15000 else {"title"})
    instruction = "Reply with one JSON object matching this JSON schema:\n" + json.dumps(
        compact, ensure_ascii=False, separators=(",", ":"))
    if messages and messages[0].role == "system" and isinstance(messages[0].content, str):
        return [ChatMessage(role="system", content=f"{messages[0].content}\n\n{instruction}"), *messages[1:]]
    return [ChatMessage(role="system", content=instruction), *messages]


def extract_json(content: str) -> Any:
    """Parse JSON from a model reply, tolerating reasoning blocks and code fences."""
    cleaned = _THINK.sub("", content).strip()
    fence = _FENCE.match(cleaned)
    if fence:
        cleaned = fence.group(1)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start != -1 and end > start:
            return json.loads(cleaned[start:end + 1])
        raise


class LLMGateway:
    def __init__(self, settings: Settings, provider: ChatProvider, catalog: ModelCatalog,
                 budget: BudgetService, max_repair_attempts: int = 1) -> None:
        self.settings = settings
        self.provider = provider
        self.catalog = catalog
        self.budget = budget
        self.max_repair_attempts = max_repair_attempts

    def estimate_input_tokens(self, spec: ModelSpec, messages: list[ChatMessage], schema: dict[str, Any] | None
                              ) -> int:
        tokens = self.catalog.request_overhead_tokens + self.catalog.message_overhead_tokens * len(messages)
        for message in messages:
            if isinstance(message.content, str):
                tokens += estimate_text_tokens(message.content)
                continue
            for part in message.content:
                if isinstance(part, TextPart):
                    tokens += estimate_text_tokens(part.text)
                elif isinstance(part, ImagePart):
                    tokens += estimate_image_tokens(spec, part.width, part.height)
        if schema is not None:
            tokens += estimate_text_tokens(json.dumps(schema))
        return tokens

    async def _metered_call(self, spec: ModelSpec, tier: Tier, request: ChatRequest, ctx: CallContext
                            ) -> tuple[ChatResult, Decimal]:
        input_estimate = self.estimate_input_tokens(spec, request.messages, request.response_schema)
        if input_estimate + request.max_tokens > spec.context_window:
            raise AppError("Nội dung quá dài để xử lý.", code="input_too_large")
        reserved_amount = cost_sgd(spec, input_estimate, request.max_tokens, self.settings.fx_usd_to_sgd)
        reservation = await self.budget.reserve(
            amount_sgd=reserved_amount, purpose=ctx.purpose, provider=self.provider.name, model=spec.id,
            tier=tier, user_id=ctx.user_id, job_id=ctx.job_id, request_id=request_id_var.get())
        try:
            result = await self.provider.chat(request)
        except ProviderError as exc:
            if exc.request_sent:
                exc.charged_sgd = await self.budget.settle(reservation, actual_sgd=None, prompt_tokens=None,
                                                           completion_tokens=None, latency_ms=None,
                                                           outcome=f"provider_{exc.kind}")
            else:
                await self.budget.release(reservation, outcome=f"provider_{exc.kind}")
            raise
        except BaseException:
            # Cancellation/unknown failure: the provider may have processed the call. Charge it.
            await asyncio.shield(self.budget.settle(reservation, actual_sgd=None, prompt_tokens=None,
                                                    completion_tokens=None, latency_ms=None, outcome="aborted"))
            raise
        actual = (cost_sgd(spec, result.usage.prompt_tokens, result.usage.completion_tokens,
                           self.settings.fx_usd_to_sgd) if result.usage else None)
        charged = await self.budget.settle(
            reservation, actual_sgd=actual,
            prompt_tokens=result.usage.prompt_tokens if result.usage else None,
            completion_tokens=result.usage.completion_tokens if result.usage else None,
            latency_ms=result.latency_ms, outcome="ok")
        return result, charged

    async def _call_with_retries(self, spec: ModelSpec, tier: Tier, request: ChatRequest, ctx: CallContext,
                                 max_retries: int | None = None) -> tuple[ChatResult, Decimal, int]:
        retries = self.settings.soclaas_max_retries if max_retries is None else max_retries
        attempts = 0
        total = Decimal(0)
        while True:
            attempts += 1
            try:
                result, charged = await self._metered_call(spec, tier, request, ctx)
                return result, total + charged, attempts
            except ProviderError as exc:
                total += exc.charged_sgd
                logger.warning("model_call_error", extra={"kind": exc.kind, "status": exc.status,
                                                          "model": spec.id, "attempt": attempts})
                if not exc.retryable or attempts > retries:
                    raise ModelCallFailed(retryable=exc.retryable, kind=exc.kind, cost_sgd=total) from exc
                await asyncio.sleep(min(2.0 * attempts, 8.0))

    async def structured[T: BaseModel](self, *, tier: Tier, ctx: CallContext, messages: list[ChatMessage],
                                       output: type[T], max_tokens: int, schema_name: str,
                                       temperature: float = 0.0, thinking: bool | None = None,
                                       timeout_seconds: float | None = None, max_retries: int | None = None
                                       ) -> StructuredResult[T]:
        """Structured call. `thinking`: None keeps the provider default (no flag sent); True enables hidden
        reasoning with the model's larger output/time budget; False switches it off. Only applied where the
        model supports switching it."""
        spec = self.catalog.for_tier(tier)
        if any(isinstance(p, ImagePart) for m in messages if not isinstance(m.content, str) for p in m.content) \
                and not spec.vision:
            raise AppError(f"Mô hình '{spec.id}' không hỗ trợ đọc ảnh.", code="model_not_configured")
        status = await self.budget.status()
        controllable = spec.thinking_control != "none" and thinking is not None
        if thinking and status.state == BudgetState.RESTRICTED:
            thinking = False  # restricted budget mode: no long reasoning runs
        timeout = spec.thinking_timeout_seconds if thinking else timeout_seconds
        if thinking:
            max_tokens = spec.thinking_max_output_tokens or spec.max_output_tokens
        else:
            if status.state == BudgetState.RESTRICTED:
                max_tokens = max(256, max_tokens // 2)
            max_tokens = min(max_tokens, spec.max_output_tokens)
        schema = require_all_fields(output.model_json_schema())
        if spec.structured_output != "json_schema":
            messages = with_schema_instruction(messages, schema)
        conversation = list(messages)
        total_cost = Decimal(0)
        calls = 0
        last_error = ""
        for repair in range(self.max_repair_attempts + 1):
            # A JSON repair needs no reasoning: it runs with thinking off, the normal budget and timeout.
            think_now = bool(thinking) and repair == 0
            request = ChatRequest(model=spec.id, messages=conversation,
                                  max_tokens=max_tokens if think_now or not thinking
                                  else min(spec.max_output_tokens, max_tokens),
                                  temperature=temperature, response_schema=schema, schema_name=schema_name,
                                  structured_mode=spec.structured_output,
                                  thinking=(think_now if thinking else thinking) if controllable else None,
                                  timeout_seconds=timeout if think_now or not thinking else timeout_seconds)
            try:
                result, cost, attempts = await self._call_with_retries(spec, tier, request, ctx, max_retries)
            except ModelCallFailed as exc:
                exc.cost_sgd += total_cost
                raise
            total_cost += cost
            calls += attempts
            try:
                value = output.model_validate(extract_json(result.content))
                return StructuredResult(value=value, model=spec.id, cost_sgd=total_cost, calls=calls)
            except (json.JSONDecodeError, ValidationError) as exc:
                last_error = str(exc)[:1500]
                truncated = result.finish_reason == "length"
                logger.warning("invalid_structured_output", extra={"model": spec.id, "schema": schema_name,
                                                                   "truncated": truncated})
                if truncated:
                    failure = InvalidModelOutput(details={"schema": schema_name, "truncated": True})
                    failure.cost_sgd, failure.truncated = total_cost, True
                    raise failure from exc  # a repair would hit the same output limit
                conversation = [*messages,
                                ChatMessage(role="assistant", content=result.content[:6000]),
                                ChatMessage(role="user", content=(
                                    "Your previous reply did not match the required JSON schema. "
                                    f"Validation errors:\n{last_error}\n"
                                    "Reply again with only a single JSON object that matches the schema."))]
        failure = InvalidModelOutput(details={"schema": schema_name, "errors": last_error[:500]})
        failure.cost_sgd = total_cost
        raise failure
