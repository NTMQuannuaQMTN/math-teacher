"""SoCLaaS adapter (OpenAI-compatible `/v1/chat/completions`).

Replies are streamed: SoCLaaS cuts a silent (non-streamed) request at ~300 s, which killed every long reasoning call
(4 of 4 live geometry runs, 2026-11-03); a streamed one keeps bytes flowing and was measured running past 780 s
(2026-11-07). The call's own timeout is a total deadline; a stream that stays silent too long is cut as a timeout.
A server that answers with plain JSON instead of a stream is read as before. Streams are still ended by the server at
~900 s (measured 2026-11-07): a stream that stops without a finish reason is a timeout, never a partial answer.

Retries are deliberately NOT done here: every retry is a separately metered call made by the gateway,
so the budget always covers it.
"""

from __future__ import annotations

import asyncio
import base64
import json
import time
from typing import Any

import httpx

from .base import ChatRequest, ChatResult, ImagePart, ProviderError, TextPart, Usage

IDLE_SECONDS = 180.0  # a stream with no chunk for this long is dead (the server sends reasoning tokens as it thinks)


class SoclaasProvider:
    name = "soclaas"

    def __init__(self, base_url: str, api_key: str, timeout_seconds: float,
                 transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._timeout_seconds = timeout_seconds
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/") + "/",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=httpx.Timeout(timeout_seconds, connect=10.0),
            transport=transport,
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    @staticmethod
    def build_payload(request: ChatRequest) -> dict[str, Any]:
        messages: list[dict[str, Any]] = []
        for message in request.messages:
            if isinstance(message.content, str):
                messages.append({"role": message.role, "content": message.content})
                continue
            parts: list[dict[str, Any]] = []
            for part in message.content:
                if isinstance(part, TextPart):
                    parts.append({"type": "text", "text": part.text})
                elif isinstance(part, ImagePart):
                    encoded = base64.b64encode(part.data).decode()
                    parts.append({"type": "image_url",
                                  "image_url": {"url": f"data:{part.mime_type};base64,{encoded}"}})
            messages.append({"role": message.role, "content": parts})
        payload: dict[str, Any] = {
            "model": request.model,
            "messages": messages,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "stream": True,
            "stream_options": {"include_usage": True},
        }
        if request.structured_mode == "json_schema" and request.response_schema is not None:
            payload["response_format"] = {
                "type": "json_schema",
                # Pydantic schemas use optional fields, which OpenAI "strict" mode rejects; the reply is
                # validated with Pydantic regardless.
                "json_schema": {"name": request.schema_name, "schema": request.response_schema},
            }
        elif request.structured_mode == "json_object":
            payload["response_format"] = {"type": "json_object"}
        if request.thinking is not None:
            # Verified on SoCLaaS (2026-10-21): toggles Qwen 3.x hidden reasoning ("reasoning" in the reply).
            payload["chat_template_kwargs"] = {"enable_thinking": request.thinking}
        return payload

    async def chat(self, request: ChatRequest) -> ChatResult:
        payload = self.build_payload(request)
        started = time.monotonic()
        deadline = request.timeout_seconds or self._timeout_seconds
        try:
            async with asyncio.timeout(deadline):
                async with self._client.stream(
                        "POST", "chat/completions", json=payload,
                        timeout=httpx.Timeout(min(deadline, IDLE_SECONDS), connect=10.0)) as response:
                    self._raise_for_status(response.status_code)
                    if "text/event-stream" in response.headers.get("content-type", ""):
                        content, model, finish, raw_usage = await self._read_stream(response)
                    else:
                        content, model, finish, raw_usage = self._read_body(await response.aread())
        except TimeoutError as exc:
            raise ProviderError("timeout", "SoCLaaS request timed out") from exc
        except httpx.ConnectError as exc:
            raise ProviderError("connection", "Cannot connect to SoCLaaS", request_sent=False) from exc
        except httpx.TimeoutException as exc:
            raise ProviderError("timeout", "SoCLaaS request timed out") from exc
        except httpx.HTTPError as exc:
            raise ProviderError("connection", f"HTTP error: {type(exc).__name__}") from exc
        latency_ms = int((time.monotonic() - started) * 1000)

        usage: Usage | None = None
        if isinstance(raw_usage, dict) and "prompt_tokens" in raw_usage and "completion_tokens" in raw_usage:
            try:
                usage = Usage(prompt_tokens=int(raw_usage["prompt_tokens"]),
                              completion_tokens=int(raw_usage["completion_tokens"]))
            except (TypeError, ValueError):
                usage = None
        return ChatResult(content=content, model=model or request.model, usage=usage, finish_reason=finish,
                          latency_ms=latency_ms)

    @staticmethod
    def _raise_for_status(status: int) -> None:
        if status == 429:
            raise ProviderError("rate_limited", "SoCLaaS rate limit", status=429)
        if status in (401, 403):
            raise ProviderError("auth", "SoCLaaS rejected the API key", status=status, request_sent=False)
        if status >= 500:
            raise ProviderError("server_error", f"SoCLaaS error {status}", status=status)
        if status >= 400:
            raise ProviderError("bad_request", f"SoCLaaS rejected the request ({status})", status=status)

    @staticmethod
    def _read_body(raw: bytes) -> tuple[str, str | None, str | None, Any]:
        try:
            body = json.loads(raw)
            choice = body["choices"][0]
            content = choice["message"].get("content") or ""
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise ProviderError("bad_response", "Malformed SoCLaaS response") from exc
        return content, body.get("model"), choice.get("finish_reason"), body.get("usage")

    @staticmethod
    async def _read_stream(response: httpx.Response) -> tuple[str, str | None, str | None, Any]:
        """Server-sent events: the answer is the concatenated `delta.content` (hidden reasoning is not kept); the
        usage arrives in the last chunk."""
        parts: list[str] = []
        model: str | None = None
        finish: str | None = None
        usage: Any = None
        seen = False
        async for line in response.aiter_lines():
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if data == "[DONE]":
                break
            try:
                chunk = json.loads(data)
            except ValueError as exc:
                raise ProviderError("bad_response", "Malformed SoCLaaS stream") from exc
            if not isinstance(chunk, dict):
                continue
            if "error" in chunk:
                raise ProviderError("server_error", "SoCLaaS stream error")
            seen = True
            model = chunk.get("model") or model
            usage = chunk.get("usage") or usage
            for choice in chunk.get("choices") or []:
                delta = choice.get("delta") or {}
                if delta.get("content"):
                    parts.append(delta["content"])
                finish = choice.get("finish_reason") or finish
        if not seen:
            raise ProviderError("bad_response", "Empty SoCLaaS stream")
        if finish is None:
            # Cut by the server before the end (SoCLaaS ends streams at ~900 s, measured 2026-11-07): not an answer.
            raise ProviderError("timeout", "SoCLaaS stream ended before the reply was complete")
        return "".join(parts), model, finish, usage
