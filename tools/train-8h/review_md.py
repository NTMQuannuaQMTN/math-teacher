#!/usr/bin/env python3
"""Review file for one training round: every question, the app's actual answer, the reference, Claude's grade and
blank rating slots for the reviewer.

  python3 tools/train-8h/review_md.py <type> <round> <result-file-suffix>...   e.g.  algebra 1 train
Writes docs/training-8h/<type>-round<N>.md. Grades come from tools/train-8h/grades/<type>-r<N>.json:
  {"<id>": {"verdict": "đúng|sai|một phần|không có lời giải", "score": 0-10, "notes": "..."}}
"""
import json, os, sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
NAMES = {"algebra": "Đại số", "geometry": "Hình học", "number_theory": "Số học", "combinatorics": "Tổ hợp", "final": "Kiểm tra cuối (12 câu mới, 4 chuyên đề)", "final2": "Kiểm tra cuối lần 2 (12 câu mới viết sau mọi sửa lỗi ngày 15/10, chạy một lần)"}
SPLIT_VI = {"train": "luyện (bạn đã chấm)", "heldout": "kiểm tra vòng trước (bạn đã chấm)", "fresh": "câu MỚI — chưa từng dùng để sửa lỗi", "final": "kiểm tra cuối"}
SPLIT_SHORT = {"train": "luyện", "heldout": "kiểm tra cũ", "fresh": "MỚI", "final": "cuối"}
STATUS = {"verified": "đã kiểm chứng bằng máy", "partial": "kiểm chứng một phần", "not_checkable": "máy không kiểm chứng được",
          "unverified": "CHƯA kiểm chứng (có kiểm tra thất bại)"}


FAILURES = [
    ("untranslated student-facing text", "Lời giải bị loại vì vẫn còn chữ tiếng Anh/nước ngoài sau khi đã tự động sửa ngôn ngữ."),
    ("broken mathematical formatting", "Lời giải bị loại vì công thức bị lỗi, không hiển thị đúng được."),
    ("no structurally valid lesson", "Mô hình không viết được lời giải hợp lệ (dùng điều chưa chứng minh, sai cấu trúc) sau các lần thử."),
    ("game strategy has no valid", "Chiến lược trò chơi chưa được chứng minh đầy đủ cho mọi nước đi của đối thủ nên không hiển thị."),
    ("could not finish a problem that is within the curriculum", "Mô hình bỏ cuộc (cho rằng bài ngoài chương trình) ở mọi lần thử."),
    ("could not finish this problem in time", "Mô hình không giải xong trong thời gian cho phép."),
    ("contains a step or answer the checks found false", "Có lời giải nhưng không hiển thị: bộ kiểm tra phát hiện một bước hoặc đáp số sai."),
    ("timed out", "Hết thời gian."),
    ("deadline", "Hết thời gian."),
    ("wall-clock", "Hết thời gian."),
    ("empty model output", "Mô hình trả về rỗng."),
]


def failure_vi(r):
    msg = (r.get("message") or "") + " " + (r.get("error") or "")
    for key, vi in FAILURES:
        if key in msg:
            return vi
    return "Không có lời giải (lỗi hệ thống: " + (r.get("error") or "?") + ")."


def lesson_md(lesson):
    out = []
    a = lesson["analysis"]
    if lesson.get("strategy"):
        out.append(f"**Hướng giải:** {lesson['strategy']}")
    for i, s in enumerate(lesson["steps"], 1):
        out.append(f"{i}. **{s['title']}** — {s['explanation']}")
        if s.get("math"):
            out.append(f"\n   $$\n   {s['math']}\n   $$")
        if s.get("reason"):
            out.append(f"   *Lí do:* {s['reason']}")
    out.append(f"\n**Kết luận của ứng dụng:** {lesson['finalAnswer']['text']}")
    if lesson["finalAnswer"].get("math"):
        out.append(f"\n$$\n{lesson['finalAnswer']['math']}\n$$")
    return "\n".join(out)


def main():
    args = sys.argv[1:]
    override = None
    if "--override" in args:
        k = args.index("--override"); override = args[k + 1]; args = args[:k] + args[k + 2:]
    t, rnd, suffixes = args[0], args[1], args[2:]
    qs = {json.loads(l)["id"]: json.loads(l) for l in open(os.path.join(ROOT, f"data/train-8h/{t}.jsonl"))}
    gpath = os.path.join(ROOT, f"tools/train-8h/grades/{t}-r{rnd}.json")
    grades = json.load(open(gpath)) if os.path.exists(gpath) else {}
    results = []
    for suf in suffixes:
        results += json.load(open(os.path.join(ROOT, f"tools/train-8h/results/{t}-r{rnd}-{suf}.json")))["results"]
    for r in results:
        r["_round"] = rnd
    # A re-run after a fix replaces the first result of that question (marked in the file); the first result stays on disk.
    if override:
        again = {r["id"]: r for r in json.load(open(os.path.join(ROOT, f"tools/train-8h/results/{t}-r{override}-all.json")))["results"]}
        first = {r["id"]: r for r in results}
        results = [dict(again[r["id"]], _round=override, _first=first[r["id"]]) if r["id"] in again else r for r in results]
    lines = [f"# {NAMES[t]} — vòng {rnd}", "",
             "Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.",
             "Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.", ""]
    # Summary
    lines += ["| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |", "|---:|---|---|---|---|---|---:|---:|"]
    for k, r in enumerate(results, 1):
        q = qs[r["id"]]; g = grades.get(r["id"], {})
        src = (r.get("producedBy", "—") + (" (không hiển thị)" if r.get("served") is False else "")) if r["ok"] else "không có lời giải"
        lines.append(f"| {k} | `{r['id']}` | {SPLIT_SHORT.get(q['split'], q['split'])}{' (chạy lại)' if r.get('_first') else ''} | {src} | {STATUS.get(r.get('status'), '—') if r['ok'] else 'không có lời giải'} | {g.get('verdict','—')} {str(g.get('score',''))+'/10' if 'score' in g else ''} | {round(r['ms']/1000)} s | ${r.get('costUsd',0)} |")
    lines.append("")
    for k, r in enumerate(results, 1):
        q = qs[r["id"]]; g = grades.get(r["id"], {})
        rerun = []
        if r.get("_first"):
            f0 = r["_first"]
            was = (f0.get("producedBy", "") + " " + STATUS.get(f0.get("status"), "") + (" — KHÔNG hiển thị" if f0.get("served") is False else "")) if f0["ok"] else "không có lời giải"
            rerun = [f"> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: {was}. Dưới đây là kết quả lần chạy lại.", ""]
        lines += [f"## Câu {k} — `{r['id']}`", "", f"*Nguồn đề:* {q['source']} · *Tập:* {SPLIT_VI.get(q['split'], q['split'])}", "", *rerun,
                  f"**Đề bài.** {q['input']}", "", f"**Đáp án tham khảo** ({q['reference_status']}): {q['reference']}", ""]
        if r["ok"]:
            lp = os.path.join(ROOT, f"tools/train-8h/results/lessons/{t}-r{r['_round']}-{r['id'].replace('/', '_')}.json")
            data = json.load(open(lp))
            withheld = r.get("served") is False
            note = []
            if withheld:
                bad = [c["label"] for c in data["verification"]["checks"] if not c["passed"]][:3]
                note = ["> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: " + "; ".join(bad), ""]
            lines += [f"### Lời giải của ứng dụng", "", f"*Nguồn:* `{r['producedBy']}` · *Trạng thái máy:* {STATUS.get(r['status'], r['status'])} · *Thời gian:* {round(r['ms']/1000)} s · *Chi phí:* ${r.get('costUsd',0)}", "", *note, lesson_md(data["lesson"]), ""]
        else:
            lines += ["### Lời giải của ứng dụng", "", f"**Không có lời giải.** {failure_vi(r)}", ""]
        lines += ["### Claude tự chấm", "", f"- Kết luận: **{g.get('verdict','(chưa chấm)')}**" + (f" — {g['score']}/10" if 'score' in g else ""), f"- Nhận xét: {g.get('notes','')}", "",
                  "### Đánh giá của bạn", "", "- Điểm (0–10): ", "- Đúng về toán? (có / không / một phần): ", "- Trình bày dễ hiểu cho lớp 9? (có / không): ", "- Nhận xét: ", "", "---", ""]
    os.makedirs(os.path.join(ROOT, "docs/training-8h"), exist_ok=True)
    out = os.path.join(ROOT, f"docs/training-8h/{t}-round{rnd}.md")
    open(out, "w", encoding="utf-8").write("\n".join(lines))
    print("wrote", out)


if __name__ == "__main__":
    main()
