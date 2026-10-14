"""Conservative active-work ledger for the four-hour specialist session.

Run this at meaningful checkpoints. Gaps longer than three minutes are excluded
because continuity cannot be established; waiting and sleep are never charged.
"""

import datetime
import fcntl
import json
import os
import sys
from pathlib import Path


STATE = Path("tools/math-ai-4h-02/run-state.json")
BUDGET_SECONDS = 4 * 60 * 60


def utc_now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


STATE.parent.mkdir(parents=True, exist_ok=True)
with STATE.parent.joinpath(".checkpoint.lock").open("a") as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)
    now = utc_now()
    if STATE.exists():
        state = json.loads(STATE.read_text())
    else:
        state = {
            "iteration": "math-ai-4h-02",
            "budgetSeconds": BUDGET_SECONDS,
            "phaseBudgetsSeconds": {
                "audit_baseline": 1500,
                "dataset_failure_analysis": 1800,
                "high_impact_fixes": 4500,
                "specialists_verification": 3300,
                "regression_heldout": 2100,
                "report_reproducibility": 1200,
            },
            "activeSeconds": 0,
            "remainingSeconds": BUDGET_SECONDS,
            "status": "active",
            "phase": "audit_baseline",
            "startedAt": now,
            "lastHeartbeatAt": now,
            "intervals": [],
            "phases": [
                {
                    "name": "audit_baseline",
                    "startedAt": now,
                    "endedAt": None,
                    "activeSeconds": 0,
                }
            ],
            "checkpoints": [],
            "notes": [
                "This ledger starts a new four-hour session; earlier specialist work is baseline evidence, not charged here.",
                "UTC timestamps are stored; user-facing times are Asia/Singapore.",
                "Heartbeat gaps over 180 seconds, explicit waits, and host sleep are excluded conservatively.",
                "External paid inference is disabled for evaluation.",
            ],
        }

    elapsed = (
        datetime.datetime.fromisoformat(now)
        - datetime.datetime.fromisoformat(state["lastHeartbeatAt"])
    ).total_seconds()
    if elapsed >= 0:
        if state["status"] == "active":
            if elapsed > 180:
                state["intervals"].append(
                    {
                        "start": state["lastHeartbeatAt"],
                        "end": now,
                        "kind": "unmeasured-continuity",
                        "seconds": elapsed,
                        "chargedSeconds": 0,
                    }
                )
            else:
                state["activeSeconds"] += elapsed
                if state["phases"] and state["phases"][-1]["endedAt"] is None:
                    state["phases"][-1]["activeSeconds"] += elapsed
                state["intervals"].append(
                    {
                        "start": state["lastHeartbeatAt"],
                        "end": now,
                        "kind": "active",
                        "phase": state["phase"],
                        "seconds": elapsed,
                    }
                )
        else:
            state["intervals"].append(
                {
                    "start": state["lastHeartbeatAt"],
                    "end": now,
                    "kind": f'excluded-{state["status"]}',
                    "seconds": elapsed,
                }
            )

    command = sys.argv[1] if len(sys.argv) > 1 else "checkpoint"
    if command == "phase":
        if state["phases"] and state["phases"][-1]["endedAt"] is None:
            state["phases"][-1]["endedAt"] = now
        state["phase"] = sys.argv[2]
        state["phases"].append(
            {"name": state["phase"], "startedAt": now, "endedAt": None, "activeSeconds": 0}
        )
        state["status"] = "active"
    elif command == "note":
        state["checkpoints"].append({"at": now, "phase": state["phase"], "note": " ".join(sys.argv[2:])})
    elif command == "pause":
        state["status"] = "waiting"
        state["waitingReason"] = " ".join(sys.argv[2:])
    elif command == "resume":
        state["status"] = "active"
        state.pop("waitingReason", None)
    elif command == "sync-active":
        # The long-running-goal tracker measures tool/reasoning activity across
        # the whole turn. It is authoritative when sparse local heartbeats have
        # conservatively excluded a gap that actually contained engineering.
        authoritative = float(sys.argv[2])
        if authoritative > state["activeSeconds"]:
            delta = authoritative - state["activeSeconds"]
            state["activeSeconds"] = authoritative
            if state["phases"] and state["phases"][-1]["endedAt"] is None:
                state["phases"][-1]["activeSeconds"] += delta
            state["intervals"].append(
                {
                    "at": now,
                    "kind": "orchestrator-reconciliation",
                    "phase": state["phase"],
                    "chargedSeconds": delta,
                    "authoritativeActiveSeconds": authoritative,
                }
            )
    elif command == "complete":
        state["status"] = "complete"
        if state["phases"] and state["phases"][-1]["endedAt"] is None:
            state["phases"][-1]["endedAt"] = now

    state["lastHeartbeatAt"] = now
    state["remainingSeconds"] = max(0, state["budgetSeconds"] - state["activeSeconds"])
    temporary = STATE.with_suffix(".json.tmp")
    with temporary.open("w") as handle:
        handle.write(json.dumps(state, ensure_ascii=False, indent=2) + "\n")
        handle.flush()
        os.fsync(handle.fileno())
    temporary.replace(STATE)
    print(
        json.dumps(
            {key: state[key] for key in ["status", "phase", "activeSeconds", "remainingSeconds", "lastHeartbeatAt"]}
        )
    )
