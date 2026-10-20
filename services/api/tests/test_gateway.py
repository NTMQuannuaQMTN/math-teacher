from __future__ import annotations

import json
from decimal import Decimal

import pytest
from pydantic import BaseModel
from sqlalchemy import select

from app.config import Settings
from app.container import Container
from app.errors import BudgetExceeded
from app.models import LlmCall
from app.providers.base import ChatMessage, ChatRequest, ChatResult, ProviderError, Usage
from app.providers.catalog import ModelCatalog, ModelNotConfigured, cost_sgd
from app.providers.gateway import CallContext, InvalidModelOutput, LLMGateway, ModelCallFailed, extract_json
from tests.conftest import ScriptedProvider, make_catalog


class Answer(BaseModel):
    value: int


CTX = CallContext(purpose="test", user_id=None)
MSG = [ChatMessage(role="user", content="1+1?")]


async def calls(c: Container) -> list[LlmCall]:
    async with c.db.sessionmaker() as session:
        return list((await session.scalars(select(LlmCall).order_by(LlmCall.created_at))).all())


def test_cost_rounding_and_fx() -> None:
    spec = make_catalog().spec("fast-test")  # 1.00 in / 4.00 out per Mtok, SGD
    assert cost_sgd(spec, 1_000_000, 0, None) == Decimal("1.000000")
    assert cost_sgd(spec, 1, 1, None) == Decimal("0.000005")  # 0.000001 + 0.000004
    assert cost_sgd(spec, 1, 0, None) == Decimal("0.000001")  # rounded up, never down
    usd = make_catalog(currency="USD").spec("fast-test")
    with pytest.raises(ModelNotConfigured):
        cost_sgd(usd, 1000, 0, None)
    assert cost_sgd(usd, 1_000_000, 0, Decimal("1.30")) == Decimal("1.300000")


def test_unpriced_model_is_refused() -> None:
    catalog = ModelCatalog.model_validate({"models": [{"id": "x"}], "routing": {"fast": "x"}})
    with pytest.raises(ModelNotConfigured):
        cost_sgd(catalog.spec("x"), 1, 1, None)


def test_catalog_rejects_unknown_routing() -> None:
    with pytest.raises(ValueError):
        ModelCatalog.model_validate({"models": [{"id": "x"}], "routing": {"fast": "missing"}})


def test_extract_json_variants() -> None:
    assert extract_json('{"value": 1}') == {"value": 1}
    assert extract_json('<think>hmm {"no": 1}</think>\n```json\n{"value": 2}\n```') == {"value": 2}
    assert extract_json('Sure! {"value": 3} done') == {"value": 3}


async def test_structured_success_records_actual_cost(container: Container, provider: ScriptedProvider) -> None:
    provider.push('{"value": 2}')
    assert container.gateway is not None
    result = await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=500,
                                                schema_name="answer")
    assert result.value.value == 2
    # usage: 200 prompt + 50 completion at 1/4 SGD per Mtok
    assert result.cost_sgd == Decimal("0.000400")
    (call,) = await calls(container)
    assert call.status == "committed" and call.actual_sgd == Decimal("0.0004")
    assert call.reserved_sgd >= call.actual_sgd
    status = await container.budget.status()
    assert status.spent_sgd == Decimal("0.0004") and status.reserved_sgd == 0
    assert provider.requests[0].structured_mode == "json_object"


async def test_invalid_output_gets_one_metered_repair(container: Container, provider: ScriptedProvider) -> None:
    provider.push("not json at all")
    provider.push('{"value": 7}')
    assert container.gateway is not None
    result = await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=500,
                                                schema_name="answer")
    assert result.value.value == 7 and result.calls == 2
    assert len(await calls(container)) == 2
    repair_prompt = provider.requests[1].messages[-1].content
    assert isinstance(repair_prompt, str) and "did not match" in repair_prompt


async def test_repair_failure_raises(container: Container, provider: ScriptedProvider) -> None:
    provider.push('{"value": "x"}')
    provider.push('{"wrong": 1}')
    assert container.gateway is not None
    with pytest.raises(InvalidModelOutput):
        await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=500,
                                           schema_name="answer")
    assert len(await calls(container)) == 2


async def test_truncated_output_is_not_repaired(container: Container, provider: ScriptedProvider) -> None:
    provider.push(lambda r: ChatResult(content='{"value": ', model=r.model, usage=Usage(prompt_tokens=10,
                                       completion_tokens=500), finish_reason="length", latency_ms=1))
    assert container.gateway is not None
    with pytest.raises(InvalidModelOutput):
        await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=500,
                                           schema_name="answer")
    assert len(provider.requests) == 1


async def test_retry_on_server_error_charges_each_attempt(container: Container, provider: ScriptedProvider) -> None:
    provider.push(ProviderError("server_error", "boom", status=502))
    provider.push('{"value": 1}')
    assert container.gateway is not None
    await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=500,
                                       schema_name="answer")
    first, second = await calls(container)
    assert first.outcome == "provider_server_error" and first.actual_sgd == first.reserved_sgd
    assert second.outcome == "ok"


async def test_retries_are_bounded(container: Container, provider: ScriptedProvider) -> None:
    for _ in range(5):
        provider.push(ProviderError("timeout", "slow"))
    assert container.gateway is not None
    with pytest.raises(ModelCallFailed) as excinfo:
        await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=500,
                                           schema_name="answer")
    assert excinfo.value.retryable
    assert len(provider.requests) == 2  # 1 + SOCLAAS_MAX_RETRIES(1)


async def test_connection_error_releases_reservation(container: Container, provider: ScriptedProvider) -> None:
    provider.push(ProviderError("auth", "bad key", status=401, request_sent=False))
    assert container.gateway is not None
    with pytest.raises(ModelCallFailed):
        await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=500,
                                           schema_name="answer")
    (call,) = await calls(container)
    assert call.status == "released"
    assert (await container.budget.status()).spent_sgd == 0


async def test_missing_usage_charges_reservation(container: Container, provider: ScriptedProvider) -> None:
    provider.push(lambda r: ChatResult(content='{"value": 1}', model=r.model, usage=None, finish_reason="stop",
                                       latency_ms=1))
    assert container.gateway is not None
    await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=500,
                                       schema_name="answer")
    (call,) = await calls(container)
    assert call.usage_reported is False and call.actual_sgd == call.reserved_sgd


async def test_budget_exhaustion_blocks_before_calling(settings: Settings, provider: ScriptedProvider,
                                                       container: Container) -> None:
    await container.budget.reserve(amount_sgd=Decimal("9.999"), purpose="x", provider="soclaas", model="m",
                                   tier="fast", user_id=None)
    provider.push('{"value": 1}')
    assert container.gateway is not None
    with pytest.raises(BudgetExceeded):
        await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=500,
                                           schema_name="answer")
    assert provider.requests == []


async def test_restricted_mode_halves_max_tokens(container: Container, provider: ScriptedProvider) -> None:
    await container.budget.reserve(amount_sgd=Decimal("9.2"), purpose="x", provider="soclaas", model="m",
                                   tier="fast", user_id=None)
    provider.push('{"value": 1}')
    assert container.gateway is not None
    await container.gateway.structured(tier="fast", ctx=CTX, messages=MSG, output=Answer, max_tokens=2000,
                                       schema_name="answer")
    assert provider.requests[0].max_tokens == 1000


async def test_vision_required_for_images(container: Container) -> None:
    from app.providers.base import ImagePart
    assert container.gateway is not None
    msg = [ChatMessage(role="user", content=[ImagePart(data=b"x", mime_type="image/png", width=10, height=10)])]
    with pytest.raises(Exception, match="không hỗ trợ đọc ảnh"):
        await container.gateway.structured(tier="fast", ctx=CTX, messages=msg, output=Answer, max_tokens=10,
                                           schema_name="a")


async def test_reservation_covers_image_estimate(container: Container) -> None:
    assert isinstance(container.gateway, LLMGateway)
    from app.providers.base import ImagePart
    spec = container.gateway.catalog.spec("vision-test")
    msg = [ChatMessage(role="user", content=[ImagePart(data=b"x", mime_type="image/png", width=1400, height=2000)])]
    assert container.gateway.estimate_input_tokens(spec, msg, None) >= (1400 // 28) * (2000 // 28)


def test_request_schema_serialises() -> None:
    req = ChatRequest(model="m", messages=MSG, max_tokens=5, response_schema=Answer.model_json_schema())
    assert json.loads(req.model_dump_json())["max_tokens"] == 5
