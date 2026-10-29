"""Job worker loop. Runs embedded in the API process or standalone (`python -m app.workers.runner`)."""

from __future__ import annotations

import asyncio
import logging
import os
import socket
import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from ..container import Container
from ..logging_setup import job_id_var
from ..models import Job
from .figure_job import mark_figure_failed, run_figure_job
from .ocr_job import JobError, mark_document_failed, run_ocr_job
from .solve_job import mark_solution_failed, run_solve_job

logger = logging.getLogger(__name__)

Handler = Callable[[Container, Job], Awaitable[dict[str, Any]]]
HANDLERS: dict[str, Handler] = {"ocr_document": run_ocr_job, "solve_question": run_solve_job,
                                "figure_question": run_figure_job}
FAILURE_HOOKS: dict[str, Callable[[Container, Job, str, str], Awaitable[None]]] = {
    "ocr_document": mark_document_failed,
    "solve_question": mark_solution_failed,
    "figure_question": mark_figure_failed,
}


class Worker:
    def __init__(self, c: Container) -> None:
        self.c = c
        self.worker_id = f"{socket.gethostname()}:{os.getpid()}:{uuid.uuid4().hex[:6]}"
        self._stop = asyncio.Event()
        self._tasks: list[asyncio.Task[None]] = []

    async def run_one(self) -> bool:
        """Claim and execute a single job. Returns False when the queue was empty."""
        job_id = await self.c.queue.claim(self.worker_id)
        if job_id is None:
            return False
        token = job_id_var.set(str(job_id))
        try:
            async with self.c.db.sessionmaker() as session:
                job = await session.get(Job, job_id)
            if job is None:
                return True
            handler = HANDLERS.get(job.kind)
            if handler is None:
                await self.c.queue.fail(job_id, code="unknown_job", message="Loại tác vụ không hợp lệ.",
                                        retryable=False)
                return True
            try:
                result = await asyncio.wait_for(handler(self.c, job), timeout=self.c.settings.job_timeout_seconds)
            except JobError as exc:
                await self._failed(job, exc.code, exc.message, exc.retryable)
            except TimeoutError:
                await self._failed(job, "job_timeout", "Xử lý quá thời gian cho phép.", True)
            except Exception:
                logger.exception("job_crashed", extra={"kind": job.kind})
                await self._failed(job, "internal_error", "Đã xảy ra lỗi hệ thống khi xử lý.", True)
            else:
                await self.c.queue.succeed(job_id, result)
            return True
        finally:
            job_id_var.reset(token)

    async def _failed(self, job: Job, code: str, message: str, retryable: bool) -> None:
        requeued = await self.c.queue.fail(job.id, code=code, message=message, retryable=retryable)
        logger.warning("job_failed", extra={"kind": job.kind, "code": code, "requeued": requeued})
        if not requeued and job.kind in FAILURE_HOOKS:
            await FAILURE_HOOKS[job.kind](self.c, job, code, message)

    async def _loop(self) -> None:
        while not self._stop.is_set():
            try:
                worked = await self.run_one()
            except Exception:
                logger.exception("worker_loop_error")
                worked = False
            if not worked:
                try:
                    await asyncio.wait_for(self._stop.wait(), timeout=self.c.settings.worker_poll_seconds)
                except TimeoutError:
                    pass

    async def maintenance_once(self) -> None:
        failed = await self.c.queue.reap_stale(self.c.settings.job_timeout_seconds + 60)
        for job_id in failed:
            async with self.c.db.sessionmaker() as session:
                job = await session.get(Job, job_id)
            if job is not None and job.kind in FAILURE_HOOKS:
                await FAILURE_HOOKS[job.kind](self.c, job, "worker_timeout", "Xử lý quá thời gian cho phép.")
        await self.c.budget.expire_stale()
        await self.c.rate_limiter.purge()

    async def _maintenance(self) -> None:
        while not self._stop.is_set():
            try:
                await self.maintenance_once()
            except Exception:
                logger.exception("maintenance_error")
            try:
                await asyncio.wait_for(self._stop.wait(), timeout=60)
            except TimeoutError:
                pass

    def start(self) -> None:
        self._tasks = [asyncio.create_task(self._loop()) for _ in range(self.c.settings.worker_concurrency)]
        self._tasks.append(asyncio.create_task(self._maintenance()))
        logger.info("worker_started", extra={"worker_id": self.worker_id,
                                             "concurrency": self.c.settings.worker_concurrency})

    async def stop(self) -> None:
        self._stop.set()
        if not self._tasks:
            return
        # Let in-flight jobs finish their current step; unfinished jobs are reaped and retried later.
        await asyncio.wait(self._tasks, timeout=30)
        for task in self._tasks:
            task.cancel()


async def _main() -> None:
    from ..config import get_settings
    from ..container import build_container
    from ..logging_setup import configure_logging

    settings = get_settings()
    configure_logging(settings.log_level)
    container = build_container(settings)
    worker = Worker(container)
    worker.start()
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    import signal

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)
    await stop.wait()
    await worker.stop()
    await container.aclose()


if __name__ == "__main__":
    asyncio.run(_main())
