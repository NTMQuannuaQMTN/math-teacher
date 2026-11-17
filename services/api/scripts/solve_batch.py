"""Solve a list of problems with the app's own pipeline and record each solution, its time and its cost.

Made for rating sessions: the output is what a student would see (solution, verdicts, hints), plus timing.

Run (from services/api; real SoCLaaS calls, metered by the budget ledger like the app):
  uv run python scripts/solve_batch.py ../../benchmarks/rating/problems-2026-11-14.jsonl \\
      --out ../../benchmarks/rating/results-2026-11-14.jsonl --concurrency 2 --stop-at-sgd 8.5

- Resumable: problems already in --out are skipped, and each result is appended as soon as it is done, so the run
  can be stopped and restarted (or survive the terminal closing when started with nohup).
- Interleaved: problems are taken round-robin across exams, so early results cover every source.
- Budget guard: before each problem the day's spend (spent + reserved) is read from the ledger; at --stop-at-sgd no
  new problem starts (the daily ceiling in settings still applies on top).
"""

from __future__ import annotations

import argparse
import asyncio
import json
import time
from collections import defaultdict
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from app.agents.orchestrator import SolveInput, SolveOutcome
from app.config import get_settings
from app.container import build_container
from app.workers.solve_job import build_orchestrator


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def append_jsonl(path: Path, row: dict[str, Any]) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def interleave(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_exam: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        by_exam[item.get("exam", "")].append(item)
    queues = list(by_exam.values())
    out: list[dict[str, Any]] = []
    while any(queues):
        for queue in queues:
            if queue:
                out.append(queue.pop(0))
    return out


def record(item: dict[str, Any], outcome: SolveOutcome, seconds: float) -> dict[str, Any]:
    best = outcome.best
    solution = best.solution if best else None
    critique = best.critique if best else None
    return {
        "id": item["id"], "exam": item.get("exam"), "source_url": item.get("source_url"), "topic": item.get("topic"),
        "problem_text": item["problem_text"], "finished_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "seconds": round(seconds), "cost_sgd": str(outcome.cost_sgd), "state": outcome.state.value,
        "error": outcome.error_code, "topics": outcome.topics, "attempts": outcome.attempts,
        "status": best.status if best else None,
        "curriculum": best.curriculum.status if best and best.curriculum else None,
        "verdicts": [v.model_dump() for v in best.verdicts] if best else [],
        "examiner": {"verdict": critique.verdict, "issues": [i.model_dump() for i in critique.issues]}
        if critique else None,
        "defects": best.defects if best else [],
        "solution": solution.model_dump() if solution else None,
        "hints": [h.model_dump() for h in outcome.hints],
        "trace": [{k: v for k, v in t.items() if k in ("state", "ms", "thinking", "error", "verdict", "errors", "gaps",
                                                        "skipped", "figure_repaired")} for t in outcome.trace],
    }


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("problems")
    parser.add_argument("--out", required=True)
    parser.add_argument("--concurrency", type=int, default=2)
    parser.add_argument("--stop-at-sgd", type=Decimal, default=Decimal("8.5"))
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    out = Path(args.out)
    done = {row["id"] for row in read_jsonl(out)}
    items = read_jsonl(Path(args.problems))
    todo = [i for i in interleave(items) if i["id"] not in done][: args.limit]
    print(f"{len(done)} already done, {len(todo)} to solve", flush=True)
    c = build_container(get_settings())
    gate = asyncio.Semaphore(args.concurrency)
    write = asyncio.Lock()
    stopped = False

    async def solve(item: dict[str, Any]) -> None:
        nonlocal stopped
        async with gate:
            status = await c.budget.status()
            if stopped or status.spent_sgd + status.reserved_sgd >= args.stop_at_sgd:
                if not stopped:
                    print(f"budget guard: SGD {status.spent_sgd + status.reserved_sgd} today, stopping", flush=True)
                stopped = True
                return
            started = time.monotonic()
            topics = [item["topic"]] if item.get("topic") in ("algebra", "geometry", "number_theory",
                                                               "combinatorics") else []
            try:
                outcome = await build_orchestrator(c).run_solve(SolveInput(item["problem_text"], topics, None))
            except Exception as exc:  # recorded; the batch goes on
                print(f"{item['id']}: {type(exc).__name__}: {exc}", flush=True)
                return
            row = record(item, outcome, time.monotonic() - started)
            async with write:
                append_jsonl(out, row)
            print(f"{row['id']:<22} {row['seconds']:>5}s SGD {row['cost_sgd']:<9} {row['status']} "
                  f"{row['curriculum']} examiner={row['examiner']['verdict'] if row['examiner'] else None}",
                  flush=True)

    await asyncio.gather(*(solve(item) for item in todo))
    await c.aclose()


if __name__ == "__main__":
    asyncio.run(main())
