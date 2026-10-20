"""Cloudflare Access JWT verification for administrative endpoints."""

from __future__ import annotations

import asyncio
import hmac
from dataclasses import dataclass

import jwt
from jwt import PyJWKClient

from ..config import Settings
from ..errors import Forbidden, Unauthorized


@dataclass(frozen=True)
class AdminIdentity:
    email: str
    method: str  # cloudflare_access | dev_token


class AccessVerifier:
    def __init__(self, settings: Settings, jwk_client: PyJWKClient | None = None) -> None:
        self.settings = settings
        self._jwk_client = jwk_client
        if jwk_client is None and settings.cf_access_team_domain:
            self._jwk_client = PyJWKClient(
                f"https://{settings.cf_access_team_domain}/cdn-cgi/access/certs", cache_keys=True, lifespan=3600
            )

    async def verify(self, access_jwt: str | None, dev_token: str | None) -> AdminIdentity:
        settings = self.settings
        if access_jwt and self._jwk_client is not None and settings.cf_access_audience:
            try:
                key = await asyncio.to_thread(self._jwk_client.get_signing_key_from_jwt, access_jwt)
                claims = jwt.decode(
                    access_jwt,
                    key.key,
                    algorithms=["RS256"],
                    audience=settings.cf_access_audience,
                    issuer=f"https://{settings.cf_access_team_domain}",
                    options={"require": ["exp", "iat", "aud", "iss"]},
                )
            except jwt.PyJWTError as exc:
                raise Unauthorized("Phiên quản trị không hợp lệ.") from exc
            email = str(claims.get("email", "")).lower()
            if settings.admin_emails and email not in {e.lower() for e in settings.admin_emails}:
                raise Forbidden()
            return AdminIdentity(email=email, method="cloudflare_access")
        configured = settings.admin_dev_token
        if (dev_token and configured is not None and settings.environment != "production"
                and hmac.compare_digest(dev_token, configured.get_secret_value())):
            return AdminIdentity(email="dev-admin@localhost", method="dev_token")
        raise Unauthorized("Cần đăng nhập quản trị.")
