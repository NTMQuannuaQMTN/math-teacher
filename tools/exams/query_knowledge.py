"""
Queries over the knowledge map (data/knowledge/graph.json, data/knowledge/profiles.jsonl).

  python3 tools/exams/query_knowledge.py stats
  python3 tools/exams/query_knowledge.py prereqs tech.power_of_point      # concepts needed before a technique
  python3 tools/exams/query_knowledge.py technique-frequency geometry prove
  python3 tools/exams/query_knowledge.py problems-with geo.power_of_point
  python3 tools/exams/query_knowledge.py gaps alg.vieta nt.modular_arithmetic   # what a student who lacks these can't solve
"""
import json
import sys
from collections import Counter
from pathlib import Path

DATA = Path(__file__).resolve().parents[2] / "data"
graph = json.loads((DATA / "knowledge" / "graph.json").read_text())
taxonomy = json.loads((DATA / "techniques" / "taxonomy.json").read_text())
profiles = [json.loads(l) for l in (DATA / "knowledge" / "profiles.jsonl").read_text().splitlines() if l.strip()]
problems = {json.loads(l)["problem_id"]: json.loads(l) for l in (DATA / "processed" / "problems.jsonl").read_text().splitlines() if l.strip()}


def closure(concepts):
    """All prerequisite concepts, transitively."""
    out, todo = set(), list(concepts)
    while todo:
        c = todo.pop()
        if c in out:
            continue
        out.add(c)
        todo.extend(taxonomy["concepts"].get(c, {}).get("prerequisites", []))
    return out


def cmd_stats():
    print(f"{len(profiles)} profiles")
    print("difficulty:", dict(sorted(Counter(p["difficulty"] for p in profiles).items())))
    print("expected level:", dict(Counter(p["expected_level"] for p in profiles)))
    print("top techniques:", Counter(t["technique"] for p in profiles for t in p["techniques"]).most_common(12))
    print("top concepts:", Counter(k["concept"] for p in profiles for k in p["knowledge"]).most_common(12))
    print("main technique by topic:")
    for topic in sorted({problems[p["problem_id"]]["topic"] for p in profiles}):
        c = Counter(p["techniques"][0]["technique"] for p in profiles if problems[p["problem_id"]]["topic"] == topic and p["techniques"])
        print(f"  {topic}: {c.most_common(4)}")


def cmd_prereqs(tech):
    t = graph["techniques"].get(tech)
    if not t:
        sys.exit(f"unknown technique {tech}")
    direct = Counter(t["with_concepts"])
    print(f"{tech} ({t['name']}) appears in {len(t['problems'])} problems with concepts:")
    for c, n in direct.most_common():
        pre = sorted(closure([c]) - {c})
        print(f"  {c} ×{n}  (requires first: {', '.join(pre) or '—'})")


def cmd_technique_frequency(topic, kind=None):
    rows = [p for p in profiles if problems[p["problem_id"]]["topic"] == topic and (kind is None or problems[p["problem_id"]]["kind"] == kind)]
    print(f"{len(rows)} {topic} {kind or ''} problems:")
    for t, n in Counter(t["technique"] for p in rows for t in p["techniques"]).most_common():
        print(f"  {n:>2} {t} — {taxonomy['techniques'][t]['name']}")


def cmd_problems_with(concept_or_tech):
    hits = [p["problem_id"] for p in profiles if concept_or_tech in [k["concept"] for k in p["knowledge"]] + [t["technique"] for t in p["techniques"]]]
    for h in hits:
        print(f"  {h}: {problems[h]['question'][:90]}")
    print(f"{len(hits)} problems")


def cmd_gaps(*missing):
    blocked = []
    for p in profiles:
        needed = closure([k["concept"] for k in p["knowledge"]])
        lacking = needed & set(missing)
        if lacking:
            blocked.append((p["problem_id"], sorted(lacking)))
    print(f"Without {', '.join(missing)}: {len(blocked)} of {len(profiles)} problems are out of reach")
    for pid, lack in blocked:
        print(f"  {pid} (needs {', '.join(lack)})")


if __name__ == "__main__":
    cmd, *args = sys.argv[1:] or ["stats"]
    {"stats": cmd_stats, "prereqs": cmd_prereqs, "technique-frequency": cmd_technique_frequency, "problems-with": cmd_problems_with, "gaps": cmd_gaps}[cmd](*args)
