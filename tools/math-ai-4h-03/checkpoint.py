"""Checkpoint ledger for the independent anti-overfitting evaluation."""

import datetime
import json
import sys
from pathlib import Path

STATE = Path("tools/math-ai-4h-03/run-state.json")
BUDGET_SECONDS = 4 * 60 * 60


def now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


STATE.parent.mkdir(parents=True, exist_ok=True)
timestamp = now()
if STATE.exists():
    state = json.loads(STATE.read_text())
else:
    state = {
        "iteration": "math-ai-4h-03",
        "budgetSeconds": BUDGET_SECONDS,
        "activeSeconds": 0,
        "remainingSeconds": BUDGET_SECONDS,
        "status": "active",
        "phase": "audit_and_independent_baseline",
        "startedAt": timestamp,
        "updatedAt": timestamp,
        "phases": [{"name": "audit_and_independent_baseline", "startedAt": timestamp, "endedAt": None}],
        "checkpoints": [],
        "notes": [
            "Active time is synchronized from the long-running-goal tracker; idle and host sleep are excluded.",
            "UTC timestamps are stored and reported to the user in Asia/Singapore time.",
            "The math-ai-4h-02 final split is frozen historical evidence and is not used for development.",
            "External and paid inference are disabled during evaluation.",
        ],
    }

command = sys.argv[1] if len(sys.argv) > 1 else "checkpoint"
if command == "sync-active":
    state["activeSeconds"] = max(state["activeSeconds"], float(sys.argv[2]))
elif command == "phase":
    if state["phases"][-1]["endedAt"] is None:
        state["phases"][-1]["endedAt"] = timestamp
    state["phase"] = sys.argv[2]
    state["phases"].append({"name": state["phase"], "startedAt": timestamp, "endedAt": None})
elif command == "note":
    state["checkpoints"].append({"at": timestamp, "phase": state["phase"], "note": " ".join(sys.argv[2:])})
elif command == "complete":
    state["status"] = "complete"
    if state["phases"][-1]["endedAt"] is None:
        state["phases"][-1]["endedAt"] = timestamp

state["remainingSeconds"] = max(0, BUDGET_SECONDS - state["activeSeconds"])
state["updatedAt"] = timestamp
STATE.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({k: state[k] for k in ("phase", "status", "activeSeconds", "remainingSeconds", "updatedAt")}, ensure_ascii=False))
