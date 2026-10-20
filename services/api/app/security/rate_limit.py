"""Fixed-window rate limiter backed by PostgreSQL (atomic upsert, safe across processes)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..errors import RateLimited
from ..models import RateLimitBucket

_UPSERT = text(
    """
    INSERT INTO rate_limit_buckets (key, window_start, count) VALUES (:key, :window_start, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limit_buckets.count + 1
    RETURNING count
    """
)


class RateLimiter:
    def __init__(self, sessionmaker: async_sessionmaker[AsyncSession]) -> None:
        self.sessionmaker = sessionmaker

    async def hit(self, key: str, limit: int, window_seconds: int, message: str | None = None) -> None:
        now = datetime.now(UTC)
        epoch = int(now.timestamp())
        start = epoch - epoch % window_seconds
        window_start = datetime.fromtimestamp(start, UTC)
        async with self.sessionmaker() as session:
            count = (await session.execute(_UPSERT, {"key": key[:200], "window_start": window_start})).scalar_one()
            await session.commit()
        if count > limit:
            raise RateLimited(retry_after=max(1, start + window_seconds - epoch), message=message)

    async def purge(self, older_than: timedelta = timedelta(days=1)) -> int:
        async with self.sessionmaker() as session:
            result = await session.execute(
                delete(RateLimitBucket).where(RateLimitBucket.window_start < datetime.now(UTC) - older_than)
            )
            await session.commit()
            return int(getattr(result, "rowcount", 0) or 0)
