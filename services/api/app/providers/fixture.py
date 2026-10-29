"""Test/E2E-only chat provider: replies with recorded JSON chosen by the request's schema name.

Settings refuse `LLM_PROVIDER=fixture` in production, so it can never stand in for real model calls there.
"""

from __future__ import annotations

import json
from pathlib import Path

from .base import ChatRequest, ChatResult, ProviderError, Usage


class FixtureChatProvider:
    name = "soclaas"  # metered and ledgered exactly like the real provider

    def __init__(self, directory: Path) -> None:
        self.directory = directory

    def _reply(self, request: ChatRequest) -> str | None:
        """`<schema>.<name>.json` files hold {"match": phrase, "reply": {...}} and win when the phrase occurs in the
        user message; otherwise `<schema>.json` is the default reply."""
        user_text = " ".join(m.content for m in request.messages if m.role == "user" and isinstance(m.content, str))
        for candidate in sorted(self.directory.glob(f"{request.schema_name}.*.json")):
            data = json.loads(candidate.read_text(encoding="utf-8"))
            if data["match"] in user_text:
                return json.dumps(data["reply"], ensure_ascii=False)
        path = self.directory / f"{request.schema_name}.json"
        return path.read_text(encoding="utf-8") if path.exists() else None

    async def chat(self, request: ChatRequest) -> ChatResult:
        content = self._reply(request)
        if content is None:
            raise ProviderError("bad_request", f"No fixture reply for schema '{request.schema_name}'")
        return ChatResult(content=content, model=request.model,
                          usage=Usage(prompt_tokens=500, completion_tokens=200), finish_reason="stop", latency_ms=1)

    async def aclose(self) -> None:
        return None
