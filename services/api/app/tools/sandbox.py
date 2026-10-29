"""Run mathematical checks in a separate process with a hard timeout (and a memory cap on Linux).

SymPy can take unbounded time on some inputs, so no check ever runs in the API process. Checks are named
functions from `app.tools.checks.REGISTRY` that take and return JSON-compatible data; nothing from a model is
ever executed as code. A forkserver with SymPy preloaded keeps start-up around tens of milliseconds.
"""

from __future__ import annotations

import asyncio
import multiprocessing as mp
import sys
import threading
from multiprocessing.connection import Connection
from typing import Any

DEFAULT_TIMEOUT = 10.0
MEMORY_LIMIT_BYTES = 1024 * 1024 * 1024

_context: Any = None
# A thread semaphore (not asyncio): it is acquired inside the worker thread and is loop-independent.
_slots = threading.BoundedSemaphore(2)


def _ctx() -> Any:
    global _context
    if _context is None:
        method = "forkserver" if "forkserver" in mp.get_all_start_methods() else "spawn"
        ctx = mp.get_context(method)
        if method == "forkserver":
            ctx.set_forkserver_preload(["app.tools.checks"])
        _context = ctx
    return _context


def _child(conn: Connection, name: str, payload: dict[str, Any]) -> None:
    if sys.platform.startswith("linux"):
        import resource

        resource.setrlimit(resource.RLIMIT_AS, (MEMORY_LIMIT_BYTES, MEMORY_LIMIT_BYTES))
    try:
        from app.tools.checks import REGISTRY

        conn.send({"ok": True, "result": REGISTRY[name](payload)})
    except MemoryError:
        conn.send({"ok": False, "error": "memory_limit"})
    except Exception as exc:  # report, never crash silently
        conn.send({"ok": False, "error": f"{type(exc).__name__}: {str(exc)[:300]}"})
    finally:
        conn.close()


def _run_blocking(name: str, payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    with _slots:
        return _run_in_process(name, payload, timeout)


def _run_in_process(name: str, payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    ctx = _ctx()
    parent, child = ctx.Pipe(duplex=False)
    process = ctx.Process(target=_child, args=(child, name, payload), daemon=True)
    process.start()
    child.close()
    try:
        if parent.poll(timeout):
            try:
                message: dict[str, Any] = parent.recv()
                return message
            except EOFError:
                return {"ok": False, "error": "crashed"}
        return {"ok": False, "error": "timeout"}
    finally:
        if process.is_alive():
            process.kill()
        process.join(1)
        parent.close()


async def run_check(name: str, payload: dict[str, Any], limit_seconds: float = DEFAULT_TIMEOUT) -> dict[str, Any]:
    """Run REGISTRY[name](payload) in an isolated process. Returns {"ok": bool, "result"|"error": ...}."""
    return await asyncio.to_thread(_run_blocking, name, payload, limit_seconds)
