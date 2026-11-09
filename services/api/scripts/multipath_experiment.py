"""Multi-path experiment, Phase 1: generate candidates on benchmark items and measure them (no selection).

Run (from services/api; real SoCLaaS calls, metered by the budget ledger like the app):
  uv run python scripts/multipath_experiment.py --only-expected --limit 3
  uv run python scripts/multipath_experiment.py --ids hcm-2025-chuyen/1a --count 3

What it reports per item: each candidate's status, method direction, cost, tokens, latency and, when the item has a
machine-checkable reference answer, whether that candidate's answer matches it. Two derived numbers show the headroom a
selector could use: candidate 1 alone (the single solver's own call) and "any candidate correct" (oracle@k, an upper
bound that no real selector reaches). These are measurements, not a selection: Phase 1 picks nothing.

Splits: whole questions (all parts of one problem on the same side) are assigned to "dev" or "heldout", stratified
by topic with a fixed hash order (about a quarter of each topic held out), so the held-out set is never looked at
while developing. Phase 1 and 2 use dev only.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import statistics
import time
from collections import Counter
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from run_benchmark import answer_matches

from app.agents.multipath import MultiPathConfig
from app.agents.orchestrator import SolveInput
from app.config import get_settings
from app.container import build_container
from app.workers.solve_job import build_orchestrator

ROOT = Path(__file__).resolve().parents[3]
BENCH = ROOT / "benchmarks" / "authentic" / "exams-2023-2026.jsonl"
RESULTS = ROOT / "benchmarks" / "results"
HELDOUT_PERCENT = 25


def question_key(item_id: str) -> str:
    """'hcm-2025-chuyen/3a' and '…/3b' → '…/3'; 'hanoi-2025-chuyen/IV.2' → '…/IV'."""
    exam, _, number = item_id.partition("/")
    part = re.fullmatch(r"([A-Z]+)\.\d+|(\d+)[a-z]", number)
    return f"{exam}/{part.group(1) or part.group(2)}" if part else item_id


def _hash(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def splits(items: list[dict[str, Any]]) -> dict[str, str]:
    """Question key → "dev" | "heldout". Stratified by topic: within each topic the questions are ordered by a fixed
    hash and the first quarter (rounded up) is held out, so every topic is represented on both sides."""
    topic_of: dict[str, str] = {}
    for item in items:
        topic_of.setdefault(question_key(item["id"]), item.get("topic") or "other")
    by_topic: dict[str, list[str]] = {}
    for key, topic in topic_of.items():
        by_topic.setdefault(topic, []).append(key)
    result: dict[str, str] = {}
    for keys in by_topic.values():
        keys.sort(key=_hash)
        held = -(-len(keys) * HELDOUT_PERCENT // 100)
        result.update({k: "heldout" if i < held else "dev" for i, k in enumerate(keys)})
    return result


def load(args: argparse.Namespace) -> list[dict[str, Any]]:
    items = [json.loads(line) for line in BENCH.read_text(encoding="utf-8").splitlines() if line.strip()]
    side = splits(items)
    for item in items:
        item["split"] = side[question_key(item["id"])]
    if args.ids:
        wanted = set(args.ids.split(","))
        items = [i for i in items if i["id"] in wanted]
    else:
        items = [i for i in items if i["split"] == args.split]
    if args.only_expected:
        items = [i for i in items if i.get("expected")]
    if args.topic:
        items = [i for i in items if i.get("topic") == args.topic]
    return items[: args.limit] if args.limit else items


async def run_item(c: Any, item: dict[str, Any], config: MultiPathConfig, gate: asyncio.Semaphore) -> dict[str, Any]:
    async with gate:
        started = time.monotonic()
        topics = [item["topic"]] if item.get("topic") in ("algebra", "geometry", "number_theory", "combinatorics") \
            else []
        try:
            outcome, batch = await build_orchestrator(c).generate_candidates(
                SolveInput(item["problem_text"], topics, None), config)
        except Exception as exc:  # budget refusals, outages: recorded, the run goes on
            return {"id": item["id"], "error": f"{type(exc).__name__}: {exc}"[:300]}
        expected = item.get("expected")
        candidates = []
        for candidate in batch.candidates:
            row = candidate.diagnostics()
            row["matches_reference"] = answer_matches(expected, candidate.solution) if candidate.status == "ok" \
                else (False if expected else None)
            candidates.append(row)
        matches = [r["matches_reference"] for r in candidates]
        record = {"id": item["id"], "split": item["split"], "topic": item.get("topic"),
                  "topics": outcome.topics, "has_reference": bool(expected),
                  "seconds": round(time.monotonic() - started),
                  "cost_sgd": str(outcome.cost_sgd), "candidates_cost_sgd": str(batch.cost_sgd),
                  "stopped": batch.stopped, "usable": len(batch.usable),
                  "first_correct": matches[0] if expected else None,
                  "any_correct": any(m is True for m in matches) if expected else None,
                  "candidates": candidates}
        shown = " ".join(f"{r['id']}:{r['approach']}:{r['status']}"
                         + ("" if r["matches_reference"] is None else ("✓" if r["matches_reference"] else "✗"))
                         for r in candidates)
        print(f"{item['id']:<28} {record['seconds']:>5}s SGD {record['cost_sgd']:<9} {shown}", flush=True)
        return record


def p95(values: list[float]) -> float:
    return sorted(values)[max(0, round(0.95 * len(values)) - 1)] if values else 0.0


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ids", help="comma-separated item ids (overrides --split)")
    parser.add_argument("--split", choices=["dev", "heldout"], default="dev")
    parser.add_argument("--topic")
    parser.add_argument("--only-expected", action="store_true", help="items with a machine-checkable answer")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--count", type=int, default=3, help="candidates per item")
    parser.add_argument("--candidate-concurrency", type=int, default=2)
    parser.add_argument("--item-concurrency", type=int, default=1)
    parser.add_argument("--max-cost-sgd", type=Decimal, default=Decimal("0.30"), help="per item")
    args = parser.parse_args()
    if args.split == "heldout" and not args.ids:
        print("The held-out split is reserved for the Phase 3 comparison; refusing to run it during development.")
        return
    items = load(args)
    settings = get_settings()
    config = MultiPathConfig.from_settings(settings, candidate_count=args.count,
                                           concurrency=args.candidate_concurrency, max_cost_sgd=args.max_cost_sgd)
    print(f"{len(items)} items · {config.count} candidates each · up to SGD {config.max_cost_sgd} per item")
    c = build_container(settings)
    gate = asyncio.Semaphore(args.item_concurrency)
    records = await asyncio.gather(*(run_item(c, item, config, gate) for item in items))
    await c.aclose()

    RESULTS.mkdir(parents=True, exist_ok=True)
    path = RESULTS / f"multipath-phase1-{datetime.now(UTC):%Y%m%dT%H%M%SZ}.jsonl"
    path.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records), encoding="utf-8")
    done = [r for r in records if "error" not in r]
    scored = [r for r in done if r["has_reference"]]
    statuses = Counter(cand["status"] for r in done for cand in r["candidates"])
    seconds = [float(r["seconds"]) for r in done]
    cost = sum((Decimal(r["cost_sgd"]) for r in done), Decimal(0))
    print(f"\n{len(done)}/{len(records)} items ran · candidate statuses: {dict(statuses)}")
    if scored:
        print(f"with a reference answer: {len(scored)} · candidate 1 correct "
              f"{sum(1 for r in scored if r['first_correct'])} · any candidate correct (oracle, not a selection) "
              f"{sum(1 for r in scored if r['any_correct'])}")
    if seconds:
        print(f"latency per item: mean {statistics.mean(seconds):.0f}s, p95 {p95(seconds):.0f}s · cost SGD {cost} "
              f"(mean {cost / len(done):.4f}) · tokens out "
              f"{sum(c['completion_tokens'] for r in done for c in r['candidates'])} · {path}")


if __name__ == "__main__":
    asyncio.run(main())
