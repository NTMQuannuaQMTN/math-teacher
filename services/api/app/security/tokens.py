"""Opaque session tokens. Only the SHA-256 of a token is stored."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import AuthSession, User

TOKEN_PREFIX = "mts_"  # noqa: S105 - public prefix, not a secret


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@dataclass(frozen=True)
class IssuedSession:
    token: str
    user_id: uuid.UUID
    expires_at: datetime


async def create_guest(session: AsyncSession, ttl_days: int) -> IssuedSession:
    user = User(kind="guest")
    session.add(user)
    await session.flush()
    token = TOKEN_PREFIX + secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(days=ttl_days)
    session.add(AuthSession(user_id=user.id, token_hash=hash_token(token), expires_at=expires_at))
    await session.commit()
    return IssuedSession(token=token, user_id=user.id, expires_at=expires_at)


async def resolve_token(session: AsyncSession, token: str) -> uuid.UUID | None:
    if not token.startswith(TOKEN_PREFIX) or len(token) > 100:
        return None
    row = await session.scalar(
        select(AuthSession.user_id).where(
            AuthSession.token_hash == hash_token(token),
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > datetime.now(UTC),
        )
    )
    return row


async def revoke_token(session: AsyncSession, token: str) -> None:
    await session.execute(
        update(AuthSession)
        .where(AuthSession.token_hash == hash_token(token), AuthSession.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    await session.commit()
