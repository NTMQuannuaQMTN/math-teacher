from __future__ import annotations

from datetime import UTC, datetime, timedelta

import httpx
from pydantic import SecretStr
from sqlalchemy import update

from app.config import Settings
from app.container import Container
from app.main import create_app
from app.models import AuthSession
from tests.conftest import new_user


async def test_health_and_ready(client: httpx.AsyncClient) -> None:
    assert (await client.get("/health")).json()["status"] == "ok"
    ready = (await client.get("/ready")).json()
    assert ready["database"] is True and ready["ocr_configured"] is True


async def test_guest_session_and_me(client: httpx.AsyncClient) -> None:
    headers = await new_user(client)
    me = await client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200 and "user_id" in me.json()
    assert me.headers["x-request-id"]


async def test_unauthenticated_requests_rejected_in_vietnamese(client: httpx.AsyncClient) -> None:
    for method, path in [("GET", "/api/v1/documents"), ("GET", "/api/v1/usage"),
                         ("PATCH", "/api/v1/questions/00000000-0000-0000-0000-000000000000")]:
        response = await client.request(method, path, json={})
        assert response.status_code == 401
        body = response.json()["error"]
        assert body["code"] == "unauthorized" and "đăng nhập" in body["message"]


async def test_invalid_and_expired_tokens(client: httpx.AsyncClient, container: Container) -> None:
    bad = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer mts_nope"})
    assert bad.status_code == 401
    headers = await new_user(client)
    async with container.db.sessionmaker() as session:
        await session.execute(update(AuthSession).values(expires_at=datetime.now(UTC) - timedelta(seconds=1)))
        await session.commit()
    assert (await client.get("/api/v1/auth/me", headers=headers)).status_code == 401


async def test_logout_revokes(client: httpx.AsyncClient) -> None:
    headers = await new_user(client)
    assert (await client.post("/api/v1/auth/logout", headers=headers)).status_code == 204
    assert (await client.get("/api/v1/auth/me", headers=headers)).status_code == 401


async def test_turnstile_enforced_when_configured(container: Container, settings: Settings) -> None:
    calls: list[dict[str, str]] = []

    def siteverify(request: httpx.Request) -> httpx.Response:
        form = dict(x.split("=", 1) for x in request.content.decode().split("&"))
        calls.append(form)
        return httpx.Response(200, json={"success": form.get("response") == "good-token"})

    container.settings = settings.model_copy(update={"turnstile_secret_key": SecretStr("secret")})
    container.http = httpx.AsyncClient(transport=httpx.MockTransport(siteverify))
    app = create_app(container.settings, container, start_worker=False)
    app.state.container = container
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as http:
        missing = await http.post("/api/v1/auth/guest", json={})
        bad = await http.post("/api/v1/auth/guest", json={"turnstile_token": "bad"},
                              headers={"CF-Connecting-IP": "203.0.113.9"})
        good = await http.post("/api/v1/auth/guest", json={"turnstile_token": "good-token"})
    assert missing.status_code == 403 and missing.json()["error"]["code"] == "turnstile_failed"
    assert bad.status_code == 403
    assert good.status_code == 201
    assert calls[0]["remoteip"] == "203.0.113.9"


async def test_gateway_secret_required_when_configured(container: Container, settings: Settings) -> None:
    secured = settings.model_copy(update={"gateway_secret": SecretStr("s3cret")})
    container.settings = secured
    app = create_app(secured, container, start_worker=False)
    app.state.container = container
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as http:
        assert (await http.get("/health")).status_code == 200  # public
        denied = await http.post("/api/v1/auth/guest", json={})
        wrong = await http.post("/api/v1/auth/guest", json={}, headers={"X-Gateway-Secret": "nope"})
        ok = await http.post("/api/v1/auth/guest", json={}, headers={"X-Gateway-Secret": "s3cret"})
    assert denied.status_code == 403 and wrong.status_code == 403
    assert ok.status_code == 201


async def test_guest_creation_rate_limited_per_ip(container: Container, settings: Settings) -> None:
    container.settings = settings.model_copy(update={"rate_limit_guest_sessions_per_hour_per_ip": 2})
    app = create_app(container.settings, container, start_worker=False)
    app.state.container = container
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as http:
        codes = [(await http.post("/api/v1/auth/guest", json={}, headers={"CF-Connecting-IP": "198.51.100.1"}))
                 for _ in range(3)]
        other_ip = await http.post("/api/v1/auth/guest", json={}, headers={"CF-Connecting-IP": "198.51.100.2"})
    assert [r.status_code for r in codes] == [201, 201, 429]
    assert codes[2].headers["retry-after"]
    assert other_ip.status_code == 201


async def test_per_user_request_rate_limit(container: Container, settings: Settings) -> None:
    container.settings = settings.model_copy(update={"rate_limit_requests_per_minute": 3})
    app = create_app(container.settings, container, start_worker=False)
    app.state.container = container
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t") as http:
        headers = await new_user(http)
        statuses = [(await http.get("/api/v1/auth/me", headers=headers)).status_code for _ in range(4)]
    assert statuses == [200, 200, 200, 429]


async def test_validation_error_shape(client: httpx.AsyncClient, auth: dict[str, str]) -> None:
    response = await client.patch("/api/v1/questions/not-a-uuid", headers=auth, json={})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
