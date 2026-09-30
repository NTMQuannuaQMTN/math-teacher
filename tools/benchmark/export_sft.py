"""
Exports supervised fine-tuning (SFT) examples in chat JSONL (the format mlx-lm, Unsloth/TRL and
most LoRA trainers accept):

    {"messages": [{"role": "system", ...}, {"role": "user", ...}, {"role": "assistant", "content": "<lesson JSON>"}],
     "meta": {"id", "source", "model", "verification"}}

Only lessons that are (1) for TRAIN-split problems, (2) verified by the deterministic verifier and
(3) graded PASS against the verified ground truth are exported. Validation and test problems are
never exported (no leakage), and each problem appears at most once. The system prompt is exported
by the worker (worker/scripts/print-prompt.ts) so training and serving use the same prompt.

    python3 tools/benchmark/export_sft.py <benchmark results.json>... [--out tools/benchmark/sft/train.jsonl]
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(ROOT))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else os.path.join(ROOT, "sft", "train.jsonl")

items = {json.loads(line)["id"]: json.loads(line) for line in open(os.path.join(ROOT, "dataset", "problems.jsonl"), encoding="utf-8")}
prompts = json.loads(
    subprocess.run(["npx", "tsx", "scripts/print-prompt.ts"], cwd=os.path.join(REPO, "worker"), capture_output=True, text=True, check=True).stdout
)

examples, skipped = {}, []
for path in args:
    run = json.load(open(path, encoding="utf-8"))
    for row in run.get("rows", []):
        item = items.get(row["id"])
        lesson = row.get("lesson")
        if not item or item["split"] != "train":
            skipped.append((row["id"], "not a train item"))
            continue
        if row["grade"] != "PASS" or not lesson:
            skipped.append((row["id"], f"grade {row['grade']}"))
            continue
        if row["id"] in examples:
            continue
        examples[row["id"]] = {
            "messages": [
                {"role": "system", "content": prompts["withFigure" if item["topic"] == "geometry" else "noFigure"]},
                {"role": "user", "content": item["problem_text"]},
                {"role": "assistant", "content": json.dumps(lesson, ensure_ascii=False)},
            ],
            "meta": {"id": row["id"], "source": item["source"], "model": run["summary"]["system"], "verification": row["status"]},
        }

os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as fh:
    for ex in examples.values():
        fh.write(json.dumps(ex, ensure_ascii=False) + "\n")
print(f"{len(examples)} SFT examples → {out}; skipped {len(skipped)}: {skipped[:10]}")
