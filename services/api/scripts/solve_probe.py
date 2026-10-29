"""Run the solve orchestrator on ad-hoc problems against the real SoCLaaS API (metered by the budget ledger).

Run: uv run python scripts/solve_probe.py "Giải phương trình $x^2-5x+6=0$." [--topics algebra] [--json]
"""

from __future__ import annotations

import argparse
import asyncio
import json

from app.agents.orchestrator import Orchestrator, SolveInput
from app.config import get_settings
from app.container import build_container


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("problems", nargs="+")
    parser.add_argument("--topics", default="")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    c = build_container(get_settings())
    assert c.gateway is not None, c.config_problems
    orchestrator = Orchestrator(c.gateway)
    try:
        for problem in args.problems:
            outcome = await orchestrator.run_solve(SolveInput(problem, [t for t in args.topics.split(",") if t], None))
            best = outcome.best
            print("=" * 100)
            print(problem)
            print(f"state={outcome.state} topics={outcome.topics} attempts={outcome.attempts}",
                  f"cost=SGD {outcome.cost_sgd}")
            print("formalization:", outcome.formalization.model_dump_json() if outcome.formalization else None)
            if best:
                print("status:", best.status, "| curriculum:", best.curriculum.status if best.curriculum else None)
                for v in best.verdicts:
                    print("  verdict", v.label, v.status, v.reason_vi)
                for e in best.evidence:
                    print("  evidence", e.kind, e.outcome, e.strength, e.detail)
                if best.curriculum:
                    for f in best.curriculum.findings:
                        print("  curriculum", f.severity, f.message, f.excerpt)
                if args.json:
                    print(json.dumps(best.solution.model_dump(), ensure_ascii=False, indent=1))
                else:
                    for part in best.solution.parts:
                        machine = part.machine_answer.model_dump()
                        print(f"  [{part.label}] {part.final_answer_latex} | machine={machine}")
            for index, hint in enumerate(outcome.hints, start=1):
                print(f"  hint {index} [{hint.level}]: {hint.text_vi}")
            print("trace:", json.dumps(outcome.trace, ensure_ascii=False))
            if outcome.error_code:
                print("error:", outcome.error_code, outcome.error_message)
    finally:
        await c.aclose()


if __name__ == "__main__":
    asyncio.run(main())
