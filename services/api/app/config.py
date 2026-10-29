"""Application settings loaded from environment variables (see `.env.example`)."""

from __future__ import annotations

from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["development", "test", "production"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore", env_ignore_empty=True)

    environment: Environment = "development"
    log_level: str = "INFO"

    database_url: str = "postgresql+asyncpg://mathtutor:mathtutor@127.0.0.1:54329/mathtutor"
    db_pool_size: int = Field(default=5, ge=1, le=50)

    # --- Gateway / auth -------------------------------------------------------------------------
    # Shared secret sent by the Cloudflare web Worker. When set, requests without it are rejected,
    # so the API cannot be called directly around Turnstile and the gateway's checks.
    gateway_secret: SecretStr | None = None
    session_ttl_days: int = Field(default=30, ge=1, le=365)
    turnstile_secret_key: SecretStr | None = None
    turnstile_verify_url: str = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    # Cloudflare Access protects administrative routes in production.
    cf_access_team_domain: str | None = None  # e.g. "myteam.cloudflareaccess.com"
    cf_access_audience: str | None = None
    admin_emails: list[str] = Field(default_factory=list)
    # Development-only admin token. Refused in production.
    admin_dev_token: SecretStr | None = None

    # --- SoCLaaS provider -----------------------------------------------------------------------
    soclaas_base_url: str = "https://soclaas-api.comp.nus.edu.sg/v1"
    soclaas_api_key: SecretStr | None = None
    soclaas_timeout_seconds: float = Field(default=120.0, gt=0, le=600)
    soclaas_max_retries: int = Field(default=1, ge=0, le=3)
    model_catalog_path: Path = Path("config/models.json")
    # Alternative to the file: the catalogue as inline JSON (convenient for container env vars).
    model_catalog_json: str | None = None
    # Required only when a catalogue price is quoted in USD.
    fx_usd_to_sgd: Decimal | None = None
    # Explicit, test-only OCR provider. Refused in production.
    ocr_provider: Literal["soclaas", "fixture"] = "soclaas"
    # Explicit, test-only chat provider returning recorded replies per schema. Refused in production.
    llm_provider: Literal["soclaas", "fixture"] = "soclaas"

    # --- Alerts -------------------------------------------------------------------------------------
    # Optional webhook (e.g. a Slack/Discord/Google Chat incoming webhook) told when the budget state changes.
    alert_webhook_url: SecretStr | None = None

    # --- Budget ---------------------------------------------------------------------------------
    daily_budget_sgd: Decimal = Decimal("10.00")
    restricted_budget_sgd: Decimal = Decimal("9.00")
    warning_budget_sgd: Decimal = Decimal("7.00")
    per_user_daily_budget_sgd: Decimal = Decimal("1.50")
    budget_timezone: str = "Asia/Singapore"
    reservation_ttl_seconds: int = Field(default=900, ge=60)

    # --- Rate limits (per user unless stated) ---------------------------------------------------
    rate_limit_uploads_per_hour: int = 20
    rate_limit_requests_per_minute: int = 120
    rate_limit_guest_sessions_per_hour_per_ip: int = 10
    rate_limit_question_edits_per_minute: int = 60
    rate_limit_solves_per_hour: int = 30

    # --- Solving (Phase 3) ----------------------------------------------------------------------
    question_budget_sgd: Decimal = Decimal("0.30")
    solve_max_revisions: int = Field(default=2, ge=0, le=4)
    # First attempt without hidden reasoning; escalate once to reasoning when the answer fails verification.
    solve_escalate_thinking: bool = True
    # Hints come first: the full solution can be revealed after this many hints (when hints exist).
    hints_before_solution: bool = True
    min_hints_before_solution: int = Field(default=1, ge=0, le=5)
    # Tutoring (Phase 5): feedback turns per student per day (a plan limit can replace this) and per minute.
    tutoring_turns_per_day: int = Field(default=40, ge=0)
    rate_limit_tutoring_per_minute: int = 6
    # Photos/scans of notebook work, read into the work box for the student to check before sending.
    rate_limit_work_photos_per_hour: int = 20
    work_photo_max_pages: int = Field(default=3, ge=1, le=10)
    work_photo_max_chars: int = 4000

    # --- Uploads --------------------------------------------------------------------------------
    max_upload_bytes: int = 20 * 1024 * 1024
    max_pdf_pages: int = 20
    max_image_pixels: int = 40_000_000
    ocr_image_max_side: int = 2000
    pdf_render_scale: float = 2.0  # 144 DPI
    max_documents_per_user: int = 200

    # --- Storage --------------------------------------------------------------------------------
    storage_backend: Literal["local", "s3"] = "local"
    storage_local_dir: Path = Path("var/storage")
    s3_endpoint_url: str | None = None  # https://<account>.r2.cloudflarestorage.com for R2
    s3_bucket: str = "math-tutor"
    s3_access_key_id: SecretStr | None = None
    s3_secret_access_key: SecretStr | None = None
    s3_region: str = "auto"

    # --- Workers --------------------------------------------------------------------------------
    run_embedded_worker: bool = True
    worker_concurrency: int = Field(default=2, ge=1, le=16)
    worker_poll_seconds: float = 1.0
    job_timeout_seconds: int = 900  # a reasoning escalation alone can take ~5 minutes
    ocr_page_concurrency: int = Field(default=2, ge=1, le=8)

    @model_validator(mode="after")
    def _check(self) -> Settings:
        if not (self.warning_budget_sgd < self.restricted_budget_sgd < self.daily_budget_sgd):
            raise ValueError("Budget thresholds must satisfy warning < restricted < daily ceiling")
        if self.environment == "production":
            problems: list[str] = []
            if self.gateway_secret is None:
                problems.append("GATEWAY_SECRET is required in production")
            if self.turnstile_secret_key is None:
                problems.append("TURNSTILE_SECRET_KEY is required in production")
            if self.admin_dev_token is not None:
                problems.append("ADMIN_DEV_TOKEN must not be set in production")
            if self.ocr_provider != "soclaas":
                problems.append("OCR_PROVIDER=fixture is test-only and refused in production")
            if self.llm_provider != "soclaas":
                problems.append("LLM_PROVIDER=fixture is test-only and refused in production")
            if self.storage_backend != "s3":
                problems.append("STORAGE_BACKEND=s3 (Cloudflare R2) is required in production")
            if not (self.cf_access_team_domain and self.cf_access_audience):
                problems.append("CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUDIENCE are required in production")
            if "sslmode=" not in self.database_url and "ssl=" not in self.database_url and \
                    "@127.0.0.1" not in self.database_url and "@localhost" not in self.database_url:
                problems.append("DATABASE_URL must require TLS in production (add ?ssl=require)")
            if problems:
                raise ValueError("; ".join(problems))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
