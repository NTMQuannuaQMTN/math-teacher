"""Model catalogue: which models exist, what they can do, what they cost, which tier uses which model.

Prices are never assumed. A model without a configured price cannot be called (fail closed).
"""

from __future__ import annotations

import json
import math
from decimal import ROUND_CEILING, Decimal
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from ..errors import AppError
from .base import StructuredMode

Tier = Literal["ocr", "fast", "reasoning"]
TIERS: tuple[Tier, ...] = ("ocr", "fast", "reasoning")


class ModelNotConfigured(AppError):
    status_code = 503
    code = "model_not_configured"
    message = "Mô hình AI chưa được cấu hình. Hãy liên hệ quản trị viên."


class Pricing(BaseModel):
    currency: Literal["SGD", "USD"]
    input_per_mtok: Decimal = Field(ge=0)
    output_per_mtok: Decimal = Field(ge=0)


class ModelSpec(BaseModel):
    id: str = Field(min_length=1)
    vision: bool = False
    structured_output: StructuredMode = "none"
    max_output_tokens: int = Field(default=4096, gt=0)
    context_window: int = Field(default=32768, gt=0)
    # Upper-bound estimate of tokens per image pixel area (Qwen-VL style 28x28 patches by default).
    image_patch_px: int = Field(default=28, gt=0)
    pricing: Pricing | None = None
    # How hidden reasoning is switched on/off for this model ("none" = not controllable).
    thinking_control: Literal["none", "chat_template_kwargs"] = "none"
    # Reasoning needs a larger output allowance and more time (≈80 tokens/s observed on SoCLaaS).
    thinking_max_output_tokens: int | None = Field(default=None, gt=0)
    thinking_timeout_seconds: float | None = Field(default=None, gt=0)
    notes: str | None = None


class ModelCatalog(BaseModel):
    provider: Literal["soclaas"] = "soclaas"
    models: list[ModelSpec]
    routing: dict[Tier, str]
    # Fixed overheads used for conservative input estimates (chat template, special tokens).
    message_overhead_tokens: int = 16
    request_overhead_tokens: int = 256

    @model_validator(mode="after")
    def _check_routing(self) -> ModelCatalog:
        ids = {m.id for m in self.models}
        if len(ids) != len(self.models):
            raise ValueError("Duplicate model ids in catalogue")
        for tier, model_id in self.routing.items():
            if model_id not in ids:
                raise ValueError(f"Routing for tier '{tier}' references unknown model '{model_id}'")
        return self

    def spec(self, model_id: str) -> ModelSpec:
        for model in self.models:
            if model.id == model_id:
                return model
        raise ModelNotConfigured()

    def for_tier(self, tier: Tier) -> ModelSpec:
        model_id = self.routing.get(tier)
        if model_id is None:
            raise ModelNotConfigured(f"Chưa cấu hình mô hình cho tác vụ '{tier}'.")
        return self.spec(model_id)

    @classmethod
    def load(cls, path: Path) -> ModelCatalog:
        return cls.model_validate(json.loads(path.read_text(encoding="utf-8")))


_MICRO = Decimal("0.000001")


def cost_sgd(spec: ModelSpec, prompt_tokens: int, completion_tokens: int, fx_usd_to_sgd: Decimal | None
             ) -> Decimal:
    """Cost of a call in SGD, rounded up to 1e-6. Raises if pricing is missing or FX is required but unset."""
    if spec.pricing is None:
        raise ModelNotConfigured(f"Chưa cấu hình giá cho mô hình '{spec.id}'.")
    raw = (Decimal(prompt_tokens) * spec.pricing.input_per_mtok
           + Decimal(completion_tokens) * spec.pricing.output_per_mtok) / Decimal(1_000_000)
    if spec.pricing.currency == "USD":
        if fx_usd_to_sgd is None or fx_usd_to_sgd <= 0:
            raise ModelNotConfigured("Chưa cấu hình tỷ giá USD→SGD (FX_USD_TO_SGD).")
        raw *= fx_usd_to_sgd
    return raw.quantize(_MICRO, rounding=ROUND_CEILING)


def estimate_image_tokens(spec: ModelSpec, width: int, height: int) -> int:
    patch = spec.image_patch_px
    return math.ceil(width / patch) * math.ceil(height / patch) + 64


def estimate_text_tokens(text: str) -> int:
    # Conservative: Vietnamese text with diacritics and LaTeX tokenises at roughly 2.5–4 chars/token.
    return math.ceil(len(text) / 2) + 1
