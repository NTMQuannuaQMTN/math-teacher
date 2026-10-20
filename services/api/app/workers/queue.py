"""Durable job queue on PostgreSQL (`FOR UPDATE SKIP LOCKED`).

Jobs are inserted in the same transaction as the rows they act on, so a job can never reference a
document that was not committed. Cloudflare Queues can later wake idle containers; Postgres remains
the source of truth.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..models import Job

_CLAIM = text(
    """
    UPDATE jobs SET status = 'running', locked_at = now(), locked_by = :worker, attempts = attempts + 1,
        updated_at = now()
    WHERE id = (
        SELECT id FROM jobs WHERE status = 'queued' AND run_after <= now()
        ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1
    )
    RETURNING id
    """
)


def enqueue(session: AsyncSession, *, kind: str, owner_id: uuid.UUID, payload: dict[str, Any],
            document_id: uuid.UUID | None = None, max_attempts: int = 2) -> Job:
    job = Job(kind=kind, owner_id=owner_id, payload=payload, document_id=document_id, status="queued",
              max_attempts=max_attempts, progress={})
    session.add(job)
    return job


class JobQueue:
    def __init__(self, sessionmaker: async_sessionmaker[AsyncSession]) -> None:
        self.sessionmaker = sessionmaker

    async def claim(self, worker_id: str) -> uuid.UUID | None:
        async with self.sessionmaker() as session:
            job_id = (await session.execute(_CLAIM, {"worker": worker_id})).scalar_one_or_none()
            await session.commit()
            return job_id

    async def progress(self, job_id: uuid.UUID, progress: dict[str, Any]) -> None:
        async with self.sessionmaker() as session:
            await session.execute(update(Job).where(Job.id == job_id).values(progress=progress))
            await session.commit()

    async def succeed(self, job_id: uuid.UUID, result: dict[str, Any]) -> None:
        async with self.sessionmaker() as session:
            await session.execute(update(Job).where(Job.id == job_id).values(
                status="succeeded", result=result, error_code=None, error_message=None, locked_at=None))
            await session.commit()

    async def fail(self, job_id: uuid.UUID, *, code: str, message: str, retryable: bool) -> bool:
        """Mark failed, or requeue with backoff when retryable and attempts remain. Returns True if requeued."""
        async with self.sessionmaker() as session:
            job = await session.get(Job, job_id, with_for_update=True)
            if job is None:
                return False
            if retryable and job.attempts < job.max_attempts:
                job.status = "queued"
                job.run_after = datetime.now(UTC) + timedelta(seconds=15 * job.attempts)
                job.locked_at = None
                job.locked_by = None
                job.error_code = code
                job.error_message = message
                await session.commit()
                return True
            job.status = "failed"
            job.error_code = code
            job.error_message = message
            job.locked_at = None
            await session.commit()
            return False

    async def reap_stale(self, timeout_seconds: int) -> list[uuid.UUID]:
        """Requeue (or fail) jobs whose worker died. Returns ids that ended as failed."""
        async with self.sessionmaker() as session:
            rows = (await session.execute(text(
                """
                UPDATE jobs SET
                    status = CASE WHEN attempts < max_attempts THEN 'queued' ELSE 'failed' END,
                    error_code = CASE WHEN attempts < max_attempts THEN error_code ELSE 'worker_timeout' END,
                    error_message = CASE WHEN attempts < max_attempts THEN error_message
                                    ELSE 'Xử lý quá thời gian cho phép.' END,
                    locked_at = NULL, locked_by = NULL, run_after = now(), updated_at = now()
                WHERE status = 'running' AND locked_at < now() - make_interval(secs => :timeout)
                RETURNING id, status
                """
            ), {"timeout": timeout_seconds})).all()
            await session.commit()
        return [row.id for row in rows if row.status == "failed"]
