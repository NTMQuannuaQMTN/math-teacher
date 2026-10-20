"""SoCLaaS adapter (OpenAI-compatible `/v1/chat/completions`).

Retries are deliberately NOT done here: every retry is a separately metered call made by the gateway,
so the budget always covers it.
"""

from __future__ import annotations

import base64
import time
from typing import Any

import httpx

from .base import ChatRequest, ChatResult, ImagePart, ProviderError, TextPart, Usage


class SoclaasProvider:
    name = "soclaas"

    def __init__(self, base_url: str, api_key: str, timeout_seconds: float,
                 transport: httpx.AsyncBaseTransport | None = None) -> None:
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
            "stream": False,
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
        return payload

    async def chat(self, request: ChatRequest) -> ChatResult:
        payload = self.build_payload(request)
        started = time.monotonic()
        try:
            response = await self._client.post("chat/completions", json=payload)
        except httpx.ConnectError as exc:
            raise ProviderError("connection", "Cannot connect to SoCLaaS", request_sent=False) from exc
        except httpx.TimeoutException as exc:
            raise ProviderError("timeout", "SoCLaaS request timed out") from exc
        except httpx.HTTPError as exc:
            raise ProviderError("connection", f"HTTP error: {type(exc).__name__}") from exc
        latency_ms = int((time.monotonic() - started) * 1000)

        if response.status_code == 429:
            raise ProviderError("rate_limited", "SoCLaaS rate limit", status=429)
        if response.status_code in (401, 403):
            raise ProviderError("auth", "SoCLaaS rejected the API key", status=response.status_code,
                                request_sent=False)
        if response.status_code >= 500:
            raise ProviderError("server_error", f"SoCLaaS error {response.status_code}",
                                status=response.status_code)
        if response.status_code >= 400:
            raise ProviderError("bad_request", f"SoCLaaS rejected the request ({response.status_code})",
                                status=response.status_code)
        try:
            body = response.json()
            choice = body["choices"][0]
            content = choice["message"].get("content") or ""
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise ProviderError("bad_response", "Malformed SoCLaaS response") from exc

        usage: Usage | None = None
        raw_usage = body.get("usage")
        if isinstance(raw_usage, dict) and "prompt_tokens" in raw_usage and "completion_tokens" in raw_usage:
            try:
                usage = Usage(prompt_tokens=int(raw_usage["prompt_tokens"]),
                              completion_tokens=int(raw_usage["completion_tokens"]))
            except (TypeError, ValueError):
                usage = None
        return ChatResult(content=content, model=str(body.get("model") or request.model), usage=usage,
                          finish_reason=choice.get("finish_reason"), latency_ms=latency_ms)
