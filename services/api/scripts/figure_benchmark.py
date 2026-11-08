"""Figure benchmark: draw every geometry problem the way the app does and grade each figure automatically.

The grade does not trust the formalizer. A drawn figure is correct when
- the engine builds it in many positions of the free points (status "ok"),
- no object had to be left out (a misread construction), and
- every statement the problem asks to prove holds on it (a goal refuted on the figure means the figure is wrong:
  the problem's claims are true, so they must hold on a correct figure).

This is how figure drawing is "trained": SoCLaaS offers no fine-tuning, so failures found here are turned into
formalizer rules, construction recipes and engine fixes, and the benchmark is run again to measure the change.

Run (from services/api; metered against the budget like the app):
  uv run python scripts/figure_benchmark.py                    # authentic geometry items + benchmarks/figures/extra
  uv run python scripts/figure_benchmark.py --ids hcm-2025-chuyen/3a --concurrency 2
Results go to benchmarks/results/figures-<timestamp>.jsonl plus a printed summary.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import time
from collections import Counter
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from app.agents.orchestrator import SolveInput
from app.config import get_settings
from app.container import build_container
from app.geometry.dsl import GeometrySpec
from app.geometry.engine import check_spec
from app.geometry.service import geometry_spec
from app.tools.sandbox import run_check
from app.workers.solve_job import build_orchestrator

ROOT = Path(__file__).resolve().parents[3]
SOURCES = [ROOT / "benchmarks" / "authentic" / "exams-2023-2026.jsonl", ROOT / "benchmarks" / "figures" / "extra.jsonl"]
RESULTS = ROOT / "benchmarks" / "results"


def load(ids: set[str] | None) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for path in SOURCES:
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                item = json.loads(line)
                if item.get("topic") == "geometry" and (ids is None or item["id"] in ids):
                    items.append(item)
    return items


def _common_prefix(texts: list[str]) -> str:
    first = texts[0]
    end = next((i for i in range(len(first)) if any(i >= len(t) or t[i] != first[i] for t in texts[1:])), len(first))
    return first[:end]


def whole_problems(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """The authentic set stores each subquestion as its own item (shared stem + that part). A user uploads the whole
    question, so later parts can use names defined in earlier ones: rebuild it as stem + every part, labelled."""
    groups: dict[str, list[dict[str, Any]]] = {}
    for item in items:
        exam, _, number = item["id"].partition("/")
        # "IV.2" → "IV", "3a" → "3"; other ids (e.g. "user/abcd-perimeter") are whole problems already.
        part = re.fullmatch(r"([A-Z]+)\.\d+|(\d+)[a-z]", number)
        key = f"{exam}/{part.group(1) or part.group(2)}" if part else item["id"]
        groups.setdefault(key, []).append(item)
    whole: list[dict[str, Any]] = []
    for key, group in groups.items():
        texts = [g["problem_text"] for g in group]
        if len(group) == 1:
            whole.append({**group[0], "id": key})
            continue
        stem = _common_prefix(texts)
        stem = stem[:stem.rfind(".") + 1] if "." in stem else stem  # cut at the last full sentence
        parts = [f"{chr(97 + i)}) {t[len(stem):].strip()}" for i, t in enumerate(texts)]
        whole.append({**group[0], "id": key, "problem_text": stem.strip() + "\n" + "\n".join(parts)})
    return whole


def grade(spec: dict[str, Any] | None, figure: dict[str, Any] | None) -> dict[str, Any]:
    if spec is None:
        return {"grade": "no_figure", "status": None}
    if figure is None:
        return {"grade": "check_failed", "status": None}
    data = figure["data"]
    out: dict[str, Any] = {"status": data["status"], "left_out": data.get("left_out") or [],
                           "detail": figure.get("detail") or ""}
    if data["status"] != "ok":
        return {**out, "grade": data["status"]}
    goals = check_spec(GeometrySpec.model_validate(data["spec"]), samples=12).get("goals", [])
    outcomes = Counter(g["outcome"] for g in goals)
    out["goals"] = dict(outcomes)
    out["refuted"] = [g["kind"] for g in goals if g["outcome"] == "refuted"]
    if out["refuted"]:
        out["grade"] = "wrong_figure"
    elif out["left_out"]:
        out["grade"] = "partial"
    else:
        out["grade"] = "correct"
    return out


async def run_one(c: Any, item: dict[str, Any], gate: asyncio.Semaphore) -> dict[str, Any]:
    async with gate:
        started = time.monotonic()
        record: dict[str, Any] = {"id": item["id"]}
        try:
            outcome = await build_orchestrator(c).figure_only(SolveInput(item["problem_text"], ["geometry"], None))
        except Exception as exc:  # budget refusals, provider outages: recorded, the run goes on
            return {**record, "grade": "error", "error": f"{type(exc).__name__}: {exc}"[:300],
                    "seconds": round(time.monotonic() - started)}
        spec = geometry_spec(outcome.drawing)
        figure = None
        if spec is not None:
            checked = await run_check("figure", {"spec": spec}, limit_seconds=30)
            figure = checked["result"] if checked.get("ok") else None
        formalize = next((t for t in outcome.trace if t.get("state") == "formalize"), {})
        record.update(grade(spec, figure))
        record.update({"seconds": round(time.monotonic() - started), "cost_sgd": str(outcome.cost_sgd),
                       "figure_repaired": formalize.get("figure_repaired"),
                       "figure_problems": formalize.get("figure_problems"),
                       "figure_problems_after_repair": formalize.get("figure_problems_after_repair"), "spec": spec})
        print(f"{record['id']:<28} {record['grade']:<13} {record['seconds']:>4}s  "
              f"{record.get('goals', '')} {record.get('refuted') or ''} {record.get('left_out') or ''}", flush=True)
        return record


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ids", help="comma-separated item ids")
    parser.add_argument("--concurrency", type=int, default=3)
    parser.add_argument("--whole", action="store_true", help="one item per question: stem + all its parts")
    args = parser.parse_args()
    items = load(set(args.ids.split(",")) if args.ids else None)
    if args.whole:
        items = whole_problems(items)
    c = build_container(get_settings())
    gate = asyncio.Semaphore(args.concurrency)
    records = await asyncio.gather(*(run_one(c, item, gate) for item in items))
    await c.aclose()

    RESULTS.mkdir(parents=True, exist_ok=True)
    path = RESULTS / f"figures-{datetime.now(UTC):%Y%m%dT%H%M%SZ}.jsonl"
    path.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records), encoding="utf-8")
    grades = Counter(r["grade"] for r in records)
    cost = sum(Decimal(r.get("cost_sgd", "0")) for r in records)
    print(f"\n{len(records)} figures: " + ", ".join(f"{k} {v}" for k, v in grades.most_common()))
    tried = sum(1 for r in records if r.get("figure_problems_after_repair") is not None)
    print(f"correct {grades['correct']}/{len(records)} · engine repair round tried {tried}, kept "
          f"{sum(1 for r in records if r.get('figure_repaired'))} · cost SGD {cost} · {path}")


if __name__ == "__main__":
    asyncio.run(main())
