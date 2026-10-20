from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ..container import Container
from ..errors import Unauthorized
from ..logging_setup import user_id_var
from ..security.access import AdminIdentity
from ..security.tokens import resolve_token


def get_container(request: Request) -> Container:
    container: Container = request.app.state.container
    return container


ContainerDep = Annotated[Container, Depends(get_container)]


async def get_session(c: ContainerDep) -> AsyncIterator[AsyncSession]:
    async with c.db.sessionmaker() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]


def bearer_token(authorization: Annotated[str | None, Header()] = None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    return token.strip() if scheme.lower() == "bearer" and token else None


async def current_user(c: ContainerDep, session: SessionDep,
                       token: Annotated[str | None, Depends(bearer_token)]) -> uuid.UUID:
    if token is None:
        raise Unauthorized()
    user_id = await resolve_token(session, token)
    if user_id is None:
        raise Unauthorized("Phiên đăng nhập đã hết hạn. Hãy tải lại trang.")
    user_id_var.set(str(user_id))
    await c.rate_limiter.hit(f"req:{user_id}", c.settings.rate_limit_requests_per_minute, 60)
    return user_id


UserDep = Annotated[uuid.UUID, Depends(current_user)]


async def current_admin(
    c: ContainerDep,
    cf_access_jwt_assertion: Annotated[str | None, Header()] = None,
    x_admin_token: Annotated[str | None, Header()] = None,
) -> AdminIdentity:
    return await c.access.verify(cf_access_jwt_assertion, x_admin_token)


AdminDep = Annotated[AdminIdentity, Depends(current_admin)]


def client_ip(request: Request) -> str | None:
    # CF-Connecting-IP is set by Cloudflare and forwarded by the web gateway. It is only trusted because
    # the gateway-secret middleware rejects requests that did not come through the gateway.
    return request.headers.get("cf-connecting-ip") or (request.client.host if request.client else None)
