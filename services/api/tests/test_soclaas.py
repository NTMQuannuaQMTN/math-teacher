"""SoCLaaS adapter: wire format and error mapping (HTTP mocked at the transport layer)."""

from __future__ import annotations

import json

import httpx
import pytest

from app.providers.base import ChatMessage, ChatRequest, ImagePart, ProviderError, TextPart
from app.providers.soclaas import SoclaasProvider


def provider(handler) -> SoclaasProvider:  # type: ignore[no-untyped-def]
    return SoclaasProvider("https://soclaas.test/v1", "sk-test", 5, transport=httpx.MockTransport(handler))


REQ = ChatRequest(
    model="qwen3.8:27b", max_tokens=100, structured_mode="json_schema", response_schema={"type": "object"},
    messages=[ChatMessage(role="system", content="sys"),
              ChatMessage(role="user", content=[TextPart(text="hi"),
                                                ImagePart(data=b"\x89PNG", mime_type="image/png", width=1,
                                                          height=1)])])


async def test_payload_and_parsing() -> None:
    seen: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers["authorization"]
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, json={"model": "qwen3.8:27b", "choices": [{"message": {"content": "{}"},
                                                                              "finish_reason": "stop"}],
                                         "usage": {"prompt_tokens": 12, "completion_tokens": 3}})

    p = provider(handler)
    result = await p.chat(REQ)
    await p.aclose()
    assert seen["url"] == "https://soclaas.test/v1/chat/completions"
    assert seen["auth"] == "Bearer sk-test"
    body = seen["body"]
    assert isinstance(body, dict)
    assert body["response_format"]["type"] == "json_schema"
    image = body["messages"][1]["content"][1]
    assert image["type"] == "image_url" and image["image_url"]["url"].startswith("data:image/png;base64,")
    assert result.usage is not None and result.usage.prompt_tokens == 12
    assert result.finish_reason == "stop"


async def test_missing_usage_is_none() -> None:
    p = provider(lambda r: httpx.Response(200, json={"choices": [{"message": {"content": "x"}}]}))
    assert (await p.chat(REQ)).usage is None


@pytest.mark.parametrize(("status", "kind", "sent"), [(429, "rate_limited", True), (401, "auth", False),
                                                      (503, "server_error", True), (400, "bad_request", True)])
async def test_error_mapping(status: int, kind: str, sent: bool) -> None:
    p = provider(lambda r: httpx.Response(status, json={"error": "x"}))
    with pytest.raises(ProviderError) as excinfo:
        await p.chat(REQ)
    assert excinfo.value.kind == kind and excinfo.value.request_sent is sent


async def test_timeout_and_connect_errors() -> None:
    def timeout(_: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow")

    def refused(_: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("refused")

    with pytest.raises(ProviderError) as excinfo:
        await provider(timeout).chat(REQ)
    assert excinfo.value.kind == "timeout" and excinfo.value.request_sent
    with pytest.raises(ProviderError) as excinfo:
        await provider(refused).chat(REQ)
    assert excinfo.value.kind == "connection" and not excinfo.value.request_sent


async def test_malformed_body() -> None:
    p = provider(lambda r: httpx.Response(200, text="<html>"))
    with pytest.raises(ProviderError) as excinfo:
        await p.chat(REQ)
    assert excinfo.value.kind == "bad_response"


def sse(*chunks: object) -> httpx.Response:
    body = "".join(f"data: {json.dumps(c)}\n\n" for c in chunks) + "data: [DONE]\n\n"
    return httpx.Response(200, headers={"content-type": "text/event-stream"}, content=body.encode())


async def test_streamed_reply_is_assembled_without_the_hidden_reasoning() -> None:
    seen: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["body"] = json.loads(request.content)
        return sse({"model": "qwen3.8:27b", "choices": [{"delta": {"reasoning_content": "nghĩ…"}}]},
                   {"choices": [{"delta": {"content": '{"a": '}}]},
                   {"choices": [{"delta": {"content": "1}"}, "finish_reason": "stop"}]},
                   {"choices": [], "usage": {"prompt_tokens": 20, "completion_tokens": 7}})

    p = provider(handler)
    result = await p.chat(REQ)
    body = seen["body"]
    assert isinstance(body, dict) and body["stream"] is True and body["stream_options"] == {"include_usage": True}
    assert result.content == '{"a": 1}' and result.finish_reason == "stop" and result.model == "qwen3.8:27b"
    assert result.usage is not None and result.usage.completion_tokens == 7


async def test_stream_error_and_empty_stream_are_reported() -> None:
    with pytest.raises(ProviderError) as excinfo:
        await provider(lambda r: sse({"error": {"message": "overloaded"}})).chat(REQ)
    assert excinfo.value.kind == "server_error"
    with pytest.raises(ProviderError) as excinfo:
        await provider(lambda r: httpx.Response(200, headers={"content-type": "text/event-stream"},
                                                content=b"data: [DONE]\n\n")).chat(REQ)
    assert excinfo.value.kind == "bad_response"


async def test_the_timeout_is_a_total_deadline_for_a_stream() -> None:
    import asyncio

    class Slow(httpx.AsyncByteStream):
        async def __aiter__(self):  # type: ignore[no-untyped-def]
            for _ in range(100):  # a chunk every 50 ms: never idle, but endless
                await asyncio.sleep(0.05)
                yield b'data: {"choices": [{"delta": {"content": "x"}}]}\n\n'

    p = provider(lambda r: httpx.Response(200, headers={"content-type": "text/event-stream"}, stream=Slow()))
    with pytest.raises(ProviderError) as excinfo:
        await p.chat(REQ.model_copy(update={"timeout_seconds": 0.3}))
    assert excinfo.value.kind == "timeout"
