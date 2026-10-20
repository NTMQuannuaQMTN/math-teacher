"""Cloudflare Turnstile server-side verification."""

from __future__ import annotations

import logging

import httpx

from ..config import Settings
from ..errors import AppError

logger = logging.getLogger(__name__)


class TurnstileFailed(AppError):
    status_code = 403
    code = "turnstile_failed"
    message = "Không xác minh được bạn không phải là robot. Hãy tải lại trang và thử lại."


async def verify_turnstile(settings: Settings, token: str | None, remote_ip: str | None,
                           client: httpx.AsyncClient) -> None:
    secret = settings.turnstile_secret_key
    if secret is None:
        # Only reachable outside production (enforced in Settings).
        return
    if not token or len(token) > 2048:
        raise TurnstileFailed()
    data = {"secret": secret.get_secret_value(), "response": token}
    if remote_ip:
        data["remoteip"] = remote_ip
    try:
        response = await client.post(settings.turnstile_verify_url, data=data, timeout=10.0)
        result = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("turnstile_unavailable", extra={"error_type": type(exc).__name__})
        raise AppError("Không thể xác minh lúc này. Hãy thử lại.", code="turnstile_unavailable") from exc
    if not result.get("success"):
        logger.info("turnstile_rejected", extra={"error_codes": result.get("error-codes")})
        raise TurnstileFailed()
