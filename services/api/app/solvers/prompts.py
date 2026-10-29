"""Prompts for formalization and solving. Versioned with PIPELINE_VERSION in schemas.py."""

from __future__ import annotations

import json

from ..curriculum.policy import Policy
from . import algebra, combinatorics, geometry, number_theory
from .schemas import Formalization

GUIDANCE = {
    "algebra": algebra.GUIDANCE,
    "number_theory": number_theory.GUIDANCE,
    "combinatorics": combinatorics.GUIDANCE,
    "geometry": geometry.GUIDANCE,
}

FORMALIZE_SYSTEM = """You convert Vietnamese secondary-school maths problems into machine-checkable templates.
You do NOT solve the problem and you never include an answer.

For each part (subquestion a), b), … or the whole problem if it has no parts) choose a task and a template:
- solve (Giải phương trình / hệ / tìm x, tìm các số nguyên …) → template kind "solutions": variables,
  the ORIGINAL equations exactly as stated (not simplified), conditions stated in the problem
  (e.g. "x>0"), and the domain (real unless the problem says integers / positive integers / natural numbers).
- compute (Tính, rút gọn tại …, tính giá trị) → kind "value": the expression, and "relations" = equations
  that determine the variables (only equations). Example: x1, x2 are the roots of x^2-2x-1=0 → relations
  ["x1+x2=2", "x1*x2=-1"]. A given value is a relation too ("x=3+2*sqrt(2)").
- count (Có bao nhiêu …) → kind "count": integer variables with inclusive ranges and conditions, only when the
  objects are tuples of integers (digits, numbers, choices); otherwise template null.
- extremum (giá trị lớn nhất / nhỏ nhất) → kind "extremum": objective, sense min|max, conditions, positive.
- prove an inequality → kind "inequality" (statement + conditions); an identity → "identity"; a divisibility
  for all integers → "divisibility" (expression, divisor, conditions).
- prove that something exists / construct → kind "example": the conditions a witness must satisfy.
- plane geometry (prove or compute) → kind "geometry" with a "spec" (see GEOMETRY below).
- anything else, including parameter (m) questions you cannot express → template null.

GEOMETRY spec = {"objects": [...], "givens": [...], "goals": [...], "targets": [...]}.
objects (ids = names from the problem; every object it uses must be defined; order does not matter):
  free_point; point_on_line {line}; point_on_circle {circle}; midpoint {a,b}; intersection {of:[x,y], exclude?, near?}
  (for a circle, "exclude" = the OTHER intersection than that point); projection {point,line} (foot of perpendicular);
  reflection {point,center}; centroid/orthocenter/circumcenter/incenter {points:[A,B,C]};
  line/segment/ray {through:[P,Q]}; parallel {through, to}; perpendicular {through, to}; angle_bisector {vertex,a,b};
  tangent {circle, at}; circle {center, through} or {center, radius}; circumcircle {points}; circle_diameter {a,b}.
  Every circle the problem names or describes is an object, even if nothing is constructed on it, so it is drawn:
  "(O)" → free_point O + circle {center:"O", through: a point on it}; "đường tròn ngoại tiếp tam giác ABC" → circumcircle;
  "đường tròn đường kính AB" → circle_diameter; "đường tròn nội tiếp tam giác ABC" → incenter I, projection D of I on
  BC, circle {center:"I", through:"D"}; "tứ giác ABCD nội tiếp" as a hypothesis → circumcircle {points:[A,B,C]} with D
  a point_on_circle. Only a circle the problem asks to PROVE exists ("chứng minh tứ giác … nội tiếp") stays a goal.
givens = conditions that are not constructions (triangle shape, given lengths/angles): equal_length {segments:[[A,B],[A,C]]},
  angle_value {angle:[B,A,C], degrees}, length_value {segment:[B,C], value}, length_ratio, perpendicular {lines:[[A,B],[C,D]]},
  parallel, collinear {points}, concyclic {points}, on_circle {point,circle}, on_line {point,line}, tangent_line {line:[A,B],circle}.
  Prefer constructions over givens (e.g. "H là chân đường cao từ A" → projection, not a given).
goals = what must be proven (same relation kinds). targets = what must be computed: {kind: length|angle|ratio|area, points}.
Example: "Cho tam giác ABC vuông tại A, AB = 3, AC = 4, đường cao AH. Chứng minh AH.BC = AB.AC và tính AH." →
{"objects":[{"kind":"free_point","id":"A"},{"kind":"free_point","id":"B"},{"kind":"free_point","id":"C"},
 {"kind":"line","id":"BC","through":["B","C"]},{"kind":"projection","id":"H","point":"A","line":"BC"}],
 "givens":[{"kind":"angle_value","angle":["B","A","C"],"degrees":90},{"kind":"length_value","segment":["A","B"],"value":3},
 {"kind":"length_value","segment":["A","C"],"value":4}],"goals":[],"targets":[{"kind":"length","points":["A","H"]}]}
A product equality like AH.BC = AB.AC is not a relation kind: leave it out of goals rather than approximating it.

Expression syntax: plain ASCII, explicit multiplication (2*x, not 2x), ^ for powers, sqrt(), Abs(), gcd(),
Mod(a, b) for remainders, comparisons ==, !=, <, <=, >, >=, "and" / "or". Variable names: letters, digits, _.
Every equation, condition and relation must be a formula in the declared variables only. Never write words,
sets, "in", "integer", "exists", "for all", |A|, or angle functions: put integrality in "domain", and write
exact values instead of trigonometry (sin 60° = sqrt(3)/2). If the part cannot be written this way, use
template null rather than an approximate template. Reply with a single JSON object.
"""


def formalize_user(problem: str) -> str:
    return f"Problem:\n{problem}\n\nReturn the formalization JSON."


SOLVE_SYSTEM = """You are an expert Vietnamese teacher of Toán chuyên vào lớp 10. Write a complete, correct,
rigorous solution in Vietnamese, exactly as a strong Grade 9 student should present it in the exam.

Hard rules:
1. Use ONLY methods taught in Vietnamese Grade 9 and below, or elementary Olympiad techniques from the allowed
   list. Never use: {prohibited}
2. Every step must be correct, in order, and justified. No self-talk ("Chờ đã", "Wait", "Hmm"), no abandoned
   attempts, no guessing, no English, no separate "kiểm tra lại" step, no "thử các số nhỏ" in place of proof.
   Work everything out BEFORE writing "parts": the steps are the final clean copy a student hands in, not your
   scratch work. Each step states a result that stays true; never announce a plan and then switch method
   ("Tuy nhiên, cách nhanh hơn là…"), never redo or correct an earlier step ("Đó là sai lầm", "Hãy tính lại",
   "Sửa lại"), never compute the same thing twice. If you notice a mistake, write only the corrected version.
3. Use the shortest standard textbook method. Explain non-obvious steps briefly.
4. Mathematics in LaTeX inside $...$ (inline) or $$...$$ (display). Vietnamese text outside the math.
5. Each subquestion gets its own part, with its own final answer sentence.

{guidance}
Allowed techniques (put the ids you use in "techniques"):
{allowed}

Machine answers (used by automatic verification; must match your final answer exactly):
- solution sets → machine_answer.solutions as a list of {{variable: value}} using EXACTLY these variable names
  when given: {variables}. Use [] when there is no solution.
- a number / expression / count / optimum → machine_answer.value in plain ASCII maths (2*sqrt(3)/3, not LaTeX).
- the point where an optimum is attained (or a construction's witness) → machine_answer.point.
- proofs → all three null (unless an inequality's equality case: put it in point).

If you cannot solve the problem with allowed methods, set "solved": false and explain why in
"unsolved_reason_vi". Reply with a single JSON object only.
"""


def solve_system(policy: Policy, topics: list[str], variables: list[str]) -> str:
    guidance = "\n".join(GUIDANCE[t] for t in topics if t in GUIDANCE) or "\n".join(GUIDANCE.values())
    return SOLVE_SYSTEM.format(prohibited="; ".join(r.name_vi for r in policy.prohibited), guidance=guidance,
                               allowed=policy.allowed_list_vi(topics),
                               variables=", ".join(variables) if variables else "(choose natural names)")


def solve_user(problem: str) -> str:
    return f"Đề bài:\n{problem}\n\nViết lời giải theo đúng định dạng JSON."


def revise_user(problem: str, previous_json: str, problems: list[str]) -> str:
    issues = "\n".join(f"- {p}" for p in problems)
    return (f"Đề bài:\n{problem}\n\nLời giải trước (JSON):\n{previous_json}\n\n"
            f"Lời giải trên có các vấn đề sau, phát hiện bởi công cụ kiểm tra tự động:\n{issues}\n\n"
            "Hãy viết lại TOÀN BỘ lời giải, sửa đúng các vấn đề này, theo đúng định dạng JSON. "
            "Nếu đáp số bị bác bỏ, hãy giải lại cẩn thận từ đầu thay vì chỉ sửa đáp số.")


def variable_names(formalization: Formalization | None) -> list[str]:
    if formalization is None:
        return []
    names: list[str] = []
    for part in formalization.parts:
        template = part.template
        if template is None:
            continue
        names.extend(getattr(template, "variables", []) or list(getattr(template, "ranges", {}) or {}))
    return list(dict.fromkeys(names))


def compact_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))[:8000]


def formalize_repair(problems: list[str]) -> str:
    issues = "\n".join(f"- {p}" for p in problems[:12])
    return ("Some expressions in your formalization cannot be parsed:\n" + issues +
            "\nReturn the corrected formalization JSON. Use template null for any part you cannot express exactly.")


HINTS_SYSTEM = """You write progressive hints in Vietnamese for a Grade 9 student preparing for Toán chuyên vào 10.
You are given a problem and its complete, checked solution. Write 3 to 5 hints, each more specific than the last:
1. "concept": which knowledge or tool is relevant (no computation).
2. "observation": a useful transformation or thing to notice.
3. "strategy": the main line of reasoning, without carrying it out.
4. "key_step" (optional, at most two): one key intermediate result the student can check against.
Rules: never state the final answer or the final values; never write out the full solution; follow the same method
as the given solution; only Grade 9 methods; LaTeX inside $...$; address the student as "em"; one or two sentences
per hint. Reply with a single JSON object."""


def hints_user(problem: str, solution_json: str, leaked: list[str] | None = None) -> str:
    text = f"Đề bài:\n{problem}\n\nLời giải đầy đủ (JSON, KHÔNG được tiết lộ đáp số):\n{solution_json}"
    if leaked:
        text += ("\n\nLần trước các gợi ý đã để lộ đáp số (" + ", ".join(leaked[:6]) +
                 "). Viết lại sao cho không gợi ý nào chứa đáp số.")
    return text
