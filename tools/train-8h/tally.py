"""Counts per specialty from the grades of one round (re-run results where they exist)."""
import json, sys
rows = []
for t, rnd, over in [("algebra", 4, "4b"), ("combinatorics", 3, "3b"), ("number_theory", 3, "3b"), ("geometry", 4, "4b")] + ([("final2", 1, None)] if len(sys.argv) > 1 else []):
    res = {r["id"]: r for r in json.load(open(f"tools/train-8h/results/{t}-r{rnd}-all.json"))["results"]}
    if over:
        res.update({r["id"]: r for r in json.load(open(f"tools/train-8h/results/{t}-r{over}-all.json"))["results"]})
    g = json.load(open(f"tools/train-8h/grades/{t}-r{rnd}.json"))
    qs = {json.loads(l)["id"]: json.loads(l)["split"] for l in open(f"data/train-8h/{t}.jsonl")}
    c = {"n": 0, "correct_shown": 0, "wrong_shown": 0, "withheld": 0, "none": 0, "fresh": 0, "fresh_correct_shown": 0, "score": 0}
    for id, r in res.items():
        v = g.get(id, {}).get("verdict", "?"); s = g.get(id, {}).get("score", 0)
        shown = r["ok"] and r.get("served") is not False
        c["n"] += 1; c["score"] += s
        good = shown and v.startswith("đúng") and s >= 6
        if not r["ok"]: c["none"] += 1
        elif not shown: c["withheld"] += 1
        elif good: c["correct_shown"] += 1
        else: c["wrong_shown"] += 1
        if qs.get(id) in ("fresh", "final2"):
            c["fresh"] += 1; c["fresh_correct_shown"] += good
    c["avg"] = round(c["score"] / c["n"], 1)
    print(t, c)
