"""Provider-neutral chat completion interface."""

from __future__ import annotations

from decimal import Decimal
from typing import Any, Literal, Protocol

from pydantic import BaseModel, Field


class TextPart(BaseModel):
    type: Literal["text"] = "text"
    text: str


class ImagePart(BaseModel):
    type: Literal["image"] = "image"
    data: bytes = Field(repr=False)
    mime_type: str
    width: int
    height: int


ContentPart = TextPart | ImagePart


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str | list[ContentPart]


StructuredMode = Literal["json_schema", "json_object", "none"]


class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    max_tokens: int = Field(gt=0)
    temperature: float = 0.0
    response_schema: dict[str, Any] | None = None
    schema_name: str = "result"
    structured_mode: StructuredMode = "none"
    # None = provider default. True/False toggles a model's hidden reasoning where the provider supports it.
    thinking: bool | None = None
    timeout_seconds: float | None = None


class Usage(BaseModel):
    prompt_tokens: int = Field(ge=0)
    completion_tokens: int = Field(ge=0)


class ChatResult(BaseModel):
    content: str
    model: str
    usage: Usage | None  # None when the provider did not report usage
    finish_reason: str | None = None
    latency_ms: int


ProviderErrorKind = Literal["timeout", "rate_limited", "server_error", "auth", "bad_request", "bad_response",
                            "connection"]


class ProviderError(Exception):
    def __init__(self, kind: ProviderErrorKind, message: str, *, status: int | None = None,
                 request_sent: bool = True) -> None:
        super().__init__(message)
        self.kind = kind
        self.status = status
        # False only when we know the provider never received the request (no cost incurred).
        self.request_sent = request_sent
        # Set by the gateway once the call is settled: what this failed call cost.
        self.charged_sgd: Decimal = Decimal(0)

    @property
    def retryable(self) -> bool:
        return self.kind in {"timeout", "rate_limited", "server_error", "connection"}


class ChatProvider(Protocol):
    name: str

    async def chat(self, request: ChatRequest) -> ChatResult: ...

    async def aclose(self) -> None: ...
