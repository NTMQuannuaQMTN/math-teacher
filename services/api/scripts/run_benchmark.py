"""Run the solve orchestrator on the benchmark against the real SoCLaaS API (metered by the budget ledger).

Run (from services/api):
  uv run python scripts/run_benchmark.py                       # all items
  uv run python scripts/run_benchmark.py --only-expected       # items with a machine-checkable answer
  uv run python scripts/run_benchmark.py --ids hcm-2025-chuyen/1a,ptnk-2023-chuyen/1 --concurrency 2

Scoring is independent of the solver's own verdict: when an item has an `expected` answer, the solver's machine
answer is compared with it here. A VERIFIED status on a wrong answer is counted as a false verification.
Results go to benchmarks/results/<timestamp>.jsonl plus a printed summary.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import time
from collections import Counter, defaultdict
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import sympy as sp

from app.agents.orchestrator import Orchestrator, SolveInput, SolveOutcome
from app.config import get_settings
from app.container import build_container
from app.geometry.service import geometry_spec
from app.tools.expr import ExpressionError, parse
from app.tools.sandbox import run_check

ROOT = Path(__file__).resolve().parents[3]
BENCH = ROOT / "benchmarks" / "authentic" / "exams-2023-2026.jsonl"
RESULTS = ROOT / "benchmarks" / "results"


def _equal(a: str, b: str) -> bool:
    try:
        return bool(sp.simplify(parse(a, set()) - parse(b, set())) == 0)
    except (ExpressionError, TypeError, ValueError):
        return a.replace(" ", "") == b.replace(" ", "")


def score(expected: dict[str, Any] | None, outcome: SolveOutcome) -> bool | None:
    """True/False when the reference answer is machine-checkable, else None."""
    if not expected or outcome.best is None or not outcome.best.solution.solved:
        return None if not expected else False
    answers = [p.machine_answer for p in outcome.best.solution.parts]
    if "value" in expected:
        return any(a.value is not None and _equal(a.value, expected["value"]) for a in answers)
    names: list[str] = expected["variables"]
    want = {tuple(v) for v in expected["solutions"]}
    for answer in answers:
        if answer.solutions is None:
            continue
        got_rows = []
        for solution in answer.solutions:
            keys = list(solution)
            ordered = [solution.get(n) for n in names] if set(names) <= set(keys) else \
                [solution[k] for k in keys] if len(keys) == len(names) else None
            if ordered is None or any(v is None for v in ordered):
                break
            got_rows.append(tuple(str(v) for v in ordered))
        else:
            if len(got_rows) == len(want) and all(any(all(_equal(g, w) for g, w in zip(row, target, strict=True))
                                                      for target in want) for row in got_rows):
                return True
    return False


async def figure_status(outcome: SolveOutcome) -> str:
    """Whether the geometry formalization yields a drawable, valid figure (ok/infeasible/invalid/unsupported)."""
    spec = geometry_spec(outcome.formalization)
    if spec is None:
        return "unsupported"
    result = await run_check("figure", {"spec": spec}, limit_seconds=20)
    return str(result["result"]["data"]["status"]) if result.get("ok") else "failed"


async def run_item(orchestrator: Orchestrator, item: dict[str, Any], semaphore: asyncio.Semaphore
                   ) -> dict[str, Any]:
    async with semaphore:
        started = time.monotonic()
        topics = [item["topic"]] if item["topic"] != "other" else []
        try:
            outcome = await orchestrator.run_solve(SolveInput(item["problem_text"], topics, None))
        except Exception as exc:  # budget exhaustion etc.: record and continue
            return {"id": item["id"], "error": f"{type(exc).__name__}: {exc}", "seconds": time.monotonic() - started}
        best = outcome.best
        correct = score(item.get("expected"), outcome)
        row = {
            "id": item["id"], "topic": item["topic"], "kind": item["kind"], "state": outcome.state.value,
            "verification": best.status if best else None,
            "curriculum": (best.curriculum.status if best and best.curriculum else None),
            "curriculum_findings": [{"rule": f.rule_id, "severity": f.severity, "excerpt": f.excerpt}
                                    for f in best.curriculum.findings] if best and best.curriculum else [],
            "verdicts": [{"part": v.label, "status": v.status, "reason": v.reason_vi} for v in best.verdicts]
            if best else [],
            "attempts": outcome.attempts, "cost_sgd": str(outcome.cost_sgd),
            "seconds": round(time.monotonic() - started, 1),
            "templates": [p.template.kind if p.template else None for p in outcome.formalization.parts]
            if outcome.formalization else None,
            "formalization": outcome.formalization.model_dump(mode="json") if outcome.formalization else None,
            "trace": outcome.trace,
            "has_expected": bool(item.get("expected")), "correct": correct,
            "machine_answers": [p.machine_answer.model_dump() for p in best.solution.parts] if best else None,
            "error": outcome.error_code,
            "figure": await figure_status(outcome) if item["topic"] == "geometry" else None,
        }
        print(f"{row['id']:<32} {row['verification'] or row['error']!s:<20} {row['curriculum']!s:<24} "
              f"correct={correct!s:<5} SGD {row['cost_sgd']} {row['seconds']}s", flush=True)
        return row


def summarize(rows: list[dict[str, Any]]) -> None:
    done = [r for r in rows if "error" not in r or r.get("state")]
    print("\n=== Summary ===")
    print(f"items: {len(rows)}  errors: {sum(1 for r in rows if r.get('error'))}")
    by_topic: dict[str, Counter[str]] = defaultdict(Counter)
    for r in done:
        by_topic[r.get("topic", "?")][r.get("verification") or "ERROR"] += 1
    for topic, counts in sorted(by_topic.items()):
        print(f"  {topic:<14} {dict(counts)}")
    graded = [r for r in done if r.get("has_expected")]
    if graded:
        correct = sum(1 for r in graded if r.get("correct"))
        false_verified = [r["id"] for r in graded if r.get("verification") == "VERIFIED" and not r.get("correct")]
        verified_correct = sum(1 for r in graded if r.get("verification") == "VERIFIED" and r.get("correct"))
        print(f"answer accuracy (machine-checkable items): {correct}/{len(graded)}")
        print(f"VERIFIED and correct: {verified_correct}; FALSE VERIFIED: {len(false_verified)} {false_verified}")
    figures = Counter(r["figure"] for r in done if r.get("figure"))
    if figures:
        print(f"geometry figures: {dict(figures)}")
    compliant = sum(1 for r in done if r.get("curriculum") in ("COMPLIANT", "COMPLIANT_WITH_WARNINGS"))
    print(f"curriculum compliant: {compliant}/{len(done)}")
    costs = [Decimal(r["cost_sgd"]) for r in done if r.get("cost_sgd")]
    secs = [r["seconds"] for r in done if r.get("seconds")]
    if costs:
        print(f"cost per question: mean SGD {sum(costs) / len(costs):.4f}, max SGD {max(costs):.4f}, "
              f"total SGD {sum(costs):.4f}")
        print(f"latency: mean {sum(secs) / len(secs):.0f}s, max {max(secs):.0f}s")


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ids", default="")
    parser.add_argument("--topic", default="")
    parser.add_argument("--only-expected", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--concurrency", type=int, default=2)
    args = parser.parse_args()
    items = [json.loads(line) for line in BENCH.read_text(encoding="utf-8").splitlines() if line.strip()]
    if args.ids:
        wanted = set(args.ids.split(","))
        items = [i for i in items if i["id"] in wanted]
    if args.topic:
        items = [i for i in items if i["topic"] == args.topic]
    if args.only_expected:
        items = [i for i in items if i.get("expected")]
    if args.limit:
        items = items[: args.limit]

    settings = get_settings()
    c = build_container(settings)
    assert c.gateway is not None, c.config_problems
    orchestrator = Orchestrator(c.gateway, max_revisions=settings.solve_max_revisions,
                                question_budget_sgd=settings.question_budget_sgd,
                                escalate_thinking=settings.solve_escalate_thinking)
    semaphore = asyncio.Semaphore(args.concurrency)
    try:
        rows = await asyncio.gather(*(run_item(orchestrator, item, semaphore) for item in items))
    finally:
        await c.aclose()
    RESULTS.mkdir(parents=True, exist_ok=True)
    out = RESULTS / f"{datetime.now(UTC).strftime('%Y%m%dT%H%M%SZ')}.jsonl"
    out.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    summarize(list(rows))
    print(f"\nresults: {out}")


if __name__ == "__main__":
    asyncio.run(main())
