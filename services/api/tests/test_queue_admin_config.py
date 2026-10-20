from __future__ import annotations

import asyncio
import os
import time
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from pydantic import SecretStr, ValidationError
from sqlalchemy import update

from app.config import Settings
from app.container import Container
from app.models import Job, User
from app.security.access import AccessVerifier
from app.storage.store import LocalObjectStore, S3ObjectStore, StorageError
from app.workers.queue import JobQueue, enqueue


async def _jobs(c: Container, n: int) -> list[uuid.UUID]:
    async with c.db.sessionmaker() as session:
        user = User(kind="guest")
        session.add(user)
        await session.flush()
        jobs = [enqueue(session, kind="noop", owner_id=user.id, payload={}) for _ in range(n)]
        await session.commit()
        return [j.id for j in jobs]


async def test_concurrent_claims_never_double_assign(container: Container) -> None:
    ids = await _jobs(container, 20)
    queue = JobQueue(container.db.sessionmaker)
    claimed = await asyncio.gather(*(queue.claim(f"w{i}") for i in range(30)))
    got = [c for c in claimed if c is not None]
    assert len(got) == 20 and set(got) == set(ids)


async def test_reaper_requeues_then_fails(container: Container) -> None:
    (job_id,) = await _jobs(container, 1)
    queue = JobQueue(container.db.sessionmaker)
    for expected in ("queued", "failed"):
        assert await queue.claim("w") == job_id
        async with container.db.sessionmaker() as session:
            await session.execute(update(Job).values(locked_at=datetime.now(UTC) - timedelta(hours=1)))
            await session.commit()
        failed = await queue.reap_stale(60)
        async with container.db.sessionmaker() as session:
            job = await session.get(Job, job_id)
            assert job is not None and job.status == expected
        assert (job_id in failed) == (expected == "failed")


async def test_admin_usage_requires_admin(client: httpx.AsyncClient, auth: dict[str, str]) -> None:
    assert (await client.get("/api/v1/admin/usage", headers=auth)).status_code == 401
    assert (await client.get("/api/v1/admin/usage", headers={"X-Admin-Token": "wrong"})).status_code == 401
    ok = await client.get("/api/v1/admin/usage", headers={"X-Admin-Token": "test-admin-token"})
    assert ok.status_code == 200
    body = ok.json()
    assert Decimal(body["budget"]["ceiling_sgd"]) == Decimal("10")
    assert body["admin_email"] == "dev-admin@localhost"


class _StaticJwk:
    def __init__(self, key: rsa.RSAPublicKey) -> None:
        self.key = key

    def get_signing_key_from_jwt(self, _: str) -> _StaticJwk:
        return self


@pytest.fixture
def rsa_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def _token(key: rsa.RSAPrivateKey, **overrides: object) -> str:
    now = int(time.time())
    claims = {"aud": "aud-123", "iss": "https://team.cloudflareaccess.com", "email": "Admin@Example.com",
              "iat": now, "exp": now + 300, **overrides}
    return jwt.encode(claims, key, algorithm="RS256")


async def test_cloudflare_access_jwt(settings: Settings, rsa_key: rsa.RSAPrivateKey) -> None:
    cfg = settings.model_copy(update={"cf_access_team_domain": "team.cloudflareaccess.com",
                                      "cf_access_audience": "aud-123", "admin_emails": ["admin@example.com"],
                                      "admin_dev_token": None})
    verifier = AccessVerifier(cfg, jwk_client=_StaticJwk(rsa_key.public_key()))  # type: ignore[arg-type]
    identity = await verifier.verify(_token(rsa_key), None)
    assert identity.email == "admin@example.com" and identity.method == "cloudflare_access"
    from app.errors import Forbidden, Unauthorized
    with pytest.raises(Unauthorized):
        await verifier.verify(_token(rsa_key, aud="other"), None)
    with pytest.raises(Unauthorized):
        await verifier.verify(_token(rsa_key, exp=int(time.time()) - 10), None)
    other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    with pytest.raises(Unauthorized):
        await verifier.verify(_token(other_key), None)
    with pytest.raises(Forbidden):
        await verifier.verify(_token(rsa_key, email="intruder@example.com"), None)
    with pytest.raises(Unauthorized):
        await verifier.verify(None, "any-dev-token")  # dev token not configured


def _prod(**overrides: object) -> Settings:
    base: dict[str, object] = dict(
        environment="production", gateway_secret="g", turnstile_secret_key="t", storage_backend="s3",
        cf_access_team_domain="team.cloudflareaccess.com", cf_access_audience="aud", ocr_provider="soclaas")
    base.update(overrides)
    return Settings(_env_file=None, **base)  # type: ignore[call-arg, arg-type]


def test_production_settings_guards() -> None:
    _prod()
    for override, needle in [({"ocr_provider": "fixture"}, "OCR_PROVIDER"),
                             ({"admin_dev_token": "x"}, "ADMIN_DEV_TOKEN"),
                             ({"gateway_secret": None}, "GATEWAY_SECRET"),
                             ({"turnstile_secret_key": None}, "TURNSTILE"),
                             ({"storage_backend": "local"}, "STORAGE_BACKEND"),
                             ({"cf_access_audience": None}, "CF_ACCESS")]:
        with pytest.raises(ValidationError, match=needle):
            _prod(**override)


def test_budget_threshold_order_validated() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, warning_budget_sgd=9, restricted_budget_sgd=8)  # type: ignore[call-arg, arg-type]


def test_empty_env_values_are_ignored(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SOCLAAS_API_KEY", "")
    monkeypatch.setenv("FX_USD_TO_SGD", "")
    s = Settings(_env_file=None)  # type: ignore[call-arg]
    assert s.soclaas_api_key is None and s.fx_usd_to_sgd is None


async def test_local_store_rejects_traversal(tmp_path) -> None:  # type: ignore[no-untyped-def]
    store = LocalObjectStore(tmp_path)
    for key in ["../etc/passwd", "/abs", "a/../../b", "a//b", ""]:
        with pytest.raises(StorageError):
            await store.put(key, b"x", "text/plain")
    await store.put("users/u1/documents/d1/original.png", b"data", "image/png")
    assert await store.get("users/u1/documents/d1/original.png") == b"data"
    assert await store.delete_prefix("users/u1/documents/d1") == 1
    with pytest.raises(StorageError):
        await store.get("users/u1/documents/d1/original.png")


@pytest.mark.s3
async def test_s3_store_against_seaweedfs(settings: Settings) -> None:
    endpoint = os.environ.get("TEST_S3_ENDPOINT", "http://127.0.0.1:58333")
    try:
        async with httpx.AsyncClient() as http:
            await http.get(endpoint, timeout=2)
    except httpx.HTTPError:
        pytest.skip("S3 test service not running (docker compose up -d s3)")
    cfg = settings.model_copy(update={"storage_backend": "s3", "s3_endpoint_url": endpoint,
                                      "s3_bucket": f"test-{uuid.uuid4().hex[:8]}",
                                      "s3_access_key_id": SecretStr("any"), "s3_secret_access_key": SecretStr("any"),
                                      "s3_region": "us-east-1"})
    store = S3ObjectStore(cfg)
    store.client.create_bucket(Bucket=cfg.s3_bucket)
    await store.put("users/u/documents/d/pages/1.png", b"\x89PNG-1", "image/png")
    await store.put("users/u/documents/d/pages/2.png", b"\x89PNG-2", "image/png")
    assert await store.get("users/u/documents/d/pages/2.png") == b"\x89PNG-2"
    assert await store.delete_prefix("users/u/documents/d") == 2
    with pytest.raises(StorageError):
        await store.get("users/u/documents/d/pages/1.png")
