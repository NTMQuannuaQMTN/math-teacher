"""Turn an independent formalization + the solver's machine answers into tool checks and verdicts.

Status rules (per part, then the worst part wins):
- answer tasks (solve / compute / count / extremum / construct): the solver's answer is plugged into the
  independent template. confirmed+exact|exhaustive → VERIFIED; confirmed+bounded|sampled → PARTIALLY_VERIFIED;
  refuted → INCORRECT; anything else → UNVERIFIED.
- proof tasks: the formalized statement itself is checked. Even an exhaustive check only shows the statement is
  true, not that the written proof is valid → at most PARTIALLY_VERIFIED. A refuted statement points at a
  formalization error (the problem asserts it), so the part is UNVERIFIED, never "verified".
- no template, missing machine answer, tool error or timeout → UNVERIFIED.
Agreement between models is never used as evidence.
"""

from __future__ import annotations

import re
from collections.abc import Awaitable, Callable
from typing import Any

from ..solvers.schemas import (
    CountTemplate,
    DivisibilityTemplate,
    EvidenceOut,
    ExampleTemplate,
    ExtremumTemplate,
    Formalization,
    GeometryTemplate,
    IdentityTemplate,
    InequalityTemplate,
    ModelSolution,
    PartFormalization,
    PartSolution,
    PartVerdict,
    SolveTemplate,
    ValueTemplate,
    VerificationStatus,
)

CheckRunner = Callable[[str, dict[str, Any]], Awaitable[dict[str, Any]]]

_ORDER: dict[VerificationStatus, int] = {
    "INCORRECT": 0, "UNSOLVED": 1, "UNVERIFIED": 2, "PARTIALLY_VERIFIED": 3, "VERIFIED": 4,
}
PROOF_TEMPLATES = (InequalityTemplate, IdentityTemplate, DivisibilityTemplate)


def normalize_label(label: str) -> str:
    return re.sub(r"[\s().:]", "", label).lower()


def match_parts(formalization: Formalization, solution: ModelSolution
                ) -> list[tuple[PartFormalization | None, PartSolution | None]]:
    """Pair parts by label; a single unlabeled part on either side pairs with the single part on the other."""
    forms, sols = formalization.parts, solution.parts
    if len(forms) == 1 and len(sols) == 1:
        return [(forms[0], sols[0])]
    by_label = {normalize_label(s.label): s for s in sols}
    pairs: list[tuple[PartFormalization | None, PartSolution | None]] = []
    used: set[str] = set()
    for form in forms:
        key = normalize_label(form.label)
        pairs.append((form, by_label.get(key)))
        used.add(key)
    pairs.extend((None, s) for s in sols if normalize_label(s.label) not in used)
    return pairs


def build_check(form: PartFormalization, part: PartSolution) -> tuple[str, dict[str, Any]] | str:
    """(check name, payload) — or a Vietnamese reason why no check can be built."""
    template = form.template
    answer = part.machine_answer
    if template is None:
        return "Chưa chuyển được ý này thành dạng kiểm tra tự động."
    if isinstance(template, SolveTemplate):
        if answer.solutions is None:
            return "Lời giải chưa nêu tập nghiệm ở dạng kiểm tra được."
        names = set(template.variables)
        if any(set(s) != names for s in answer.solutions):
            return "Tên ẩn trong đáp số không khớp với đề bài."
        return "solutions", {"variables": template.variables, "equations": template.equations,
                             "conditions": template.conditions, "domain": template.domain,
                             "solutions": answer.solutions, "complete": True}
    if isinstance(template, ValueTemplate):
        if not answer.value:
            return "Lời giải chưa nêu giá trị ở dạng kiểm tra được."
        return "value", {"variables": template.variables, "expression": template.expression,
                         "relations": template.relations, "expected": answer.value}
    if isinstance(template, CountTemplate):
        if not answer.value or not re.fullmatch(r"\s*\d+\s*", answer.value):
            return "Lời giải chưa nêu số lượng là một số nguyên."
        return "count", {"ranges": template.ranges, "conditions": template.conditions,
                         "distinct": template.distinct, "ordered": template.ordered, "count": int(answer.value)}
    if isinstance(template, ExtremumTemplate):
        if not answer.value or not answer.point:
            return "Lời giải chưa nêu giá trị cực trị và điểm đạt được."
        if set(answer.point) != set(template.variables):
            return "Tên ẩn trong điểm đạt cực trị không khớp với đề bài."
        return "extremum", {"variables": template.variables, "objective": template.objective,
                            "kind": template.sense, "value": answer.value, "attained_at": answer.point,
                            "conditions": template.conditions, "positive": template.positive,
                            "domain": template.domain}
    if isinstance(template, ExampleTemplate):
        if not answer.point:
            return "Lời giải chưa nêu ví dụ cụ thể."
        if template.variables and set(answer.point) != set(template.variables):
            return "Tên ẩn trong ví dụ không khớp với đề bài."
        return "example", {"values": answer.point, "conditions": template.conditions}
    if isinstance(template, InequalityTemplate):
        payload: dict[str, Any] = template.model_dump(exclude={"kind"})
        if answer.point and set(answer.point) == set(template.variables):
            payload["equality_case"] = answer.point
        return "inequality", payload
    if isinstance(template, IdentityTemplate):
        return "identity", template.model_dump(exclude={"kind"})
    if isinstance(template, DivisibilityTemplate):
        return "divisibility", template.model_dump(exclude={"kind"})
    if isinstance(template, GeometryTemplate):
        payload = {"spec": template.spec.model_dump(mode="json")}
        if template.spec.targets:
            if not answer.value:
                return "Lời giải chưa nêu giá trị cần tính ở dạng kiểm tra được."
            payload["expected"] = answer.value
        return "geometry", payload
    return "Dạng bài chưa được hỗ trợ kiểm tra."


def _display_mismatch(part: PartSolution) -> bool:
    """For an integer answer, the number must appear in the sentence shown to the student."""
    value = (part.machine_answer.value or "").strip()
    if not re.fullmatch(r"-?\d+", value):
        return False
    shown = re.sub(r"[\s{}]", "", part.final_answer_latex)
    return re.search(rf"(?<!\d){re.escape(value)}(?!\d)", shown) is None


def _status_for(form: PartFormalization, evidence: EvidenceOut) -> tuple[VerificationStatus, str]:
    proof = isinstance(form.template, PROOF_TEMPLATES) or (
        isinstance(form.template, GeometryTemplate) and not form.template.spec.targets)
    if evidence.outcome == "refuted":
        if proof:
            return "UNVERIFIED", "Mệnh đề sau khi hình thức hóa bị bác bỏ: có thể do chuyển đề chưa đúng."
        return "INCORRECT", f"Đáp số sai: {evidence.detail}"
    if evidence.outcome != "confirmed":
        return "UNVERIFIED", evidence.detail
    if proof:
        return "PARTIALLY_VERIFIED", f"Mệnh đề cần chứng minh được kiểm tra là đúng ({evidence.detail}); " \
                                     "các bước lập luận chưa được máy kiểm tra."
    if evidence.strength in ("exact", "exhaustive"):
        return "VERIFIED", evidence.detail
    return "PARTIALLY_VERIFIED", evidence.detail


async def verify_solution(formalization: Formalization | None, solution: ModelSolution, run: CheckRunner
                          ) -> tuple[list[PartVerdict], list[EvidenceOut], VerificationStatus]:
    if not solution.solved or not solution.parts:
        reason = solution.unsolved_reason_vi or "Chưa tìm được lời giải."
        return [PartVerdict(label="", status="UNSOLVED", reason_vi=reason)], [], "UNSOLVED"
    if formalization is None:
        return [PartVerdict(label=p.label, status="UNVERIFIED", reason_vi="Không chuyển được đề bài sang dạng "
                            "kiểm tra tự động.") for p in solution.parts], [], "UNVERIFIED"

    verdicts: list[PartVerdict] = []
    evidence: list[EvidenceOut] = []
    for form, part in match_parts(formalization, solution):
        if part is None:
            assert form is not None
            verdicts.append(PartVerdict(label=form.label, status="UNSOLVED", reason_vi="Lời giải bỏ sót ý này."))
            continue
        if form is None:
            verdicts.append(PartVerdict(label=part.label, status="UNVERIFIED",
                                        reason_vi="Ý này không khớp với ý nào của đề bài."))
            continue
        built = build_check(form, part)
        if isinstance(built, str):
            verdicts.append(PartVerdict(label=part.label, status="UNVERIFIED", reason_vi=built))
            continue
        name, payload = built
        result = await run(name, payload)
        if result.get("ok"):
            data = result["result"]
            item = EvidenceOut(part=part.label, source="formalization", kind=name, outcome=data["outcome"],
                               strength=data["strength"], detail=data["detail"], data=data.get("data"))
        else:
            error = str(result.get("error", "error"))
            detail = "Kiểm tra quá thời gian cho phép." if error == "timeout" else \
                "Không chạy được phép kiểm tra (biểu thức không hợp lệ)."
            item = EvidenceOut(part=part.label, source="formalization", kind=name, outcome="error",
                               strength="none", detail=detail, data={"error": error[:200]})
        evidence.append(item)
        status, reason = _status_for(form, item)
        if status == "VERIFIED" and _display_mismatch(part):
            status, reason = "PARTIALLY_VERIFIED", "Đáp số đã kiểm tra, nhưng câu trả lời hiển thị không khớp số liệu."
        verdicts.append(PartVerdict(label=part.label, status=status, reason_vi=reason))

    overall = min((v.status for v in verdicts), key=lambda s: _ORDER[s])
    return verdicts, evidence, overall


def worst(statuses: list[VerificationStatus]) -> VerificationStatus:
    return min(statuses, key=lambda s: _ORDER[s])


def template_errors(formalization: Formalization) -> list[str]:
    """Parse every expression of every template (safe, bounded parsing; nothing is evaluated).

    Returns human-readable problems, used to ask the formalizer for a repair.
    """
    from ..tools.expr import ExpressionError, parse

    problems: list[str] = []
    for part in formalization.parts:
        template = part.template
        if template is None:
            continue
        names = set(getattr(template, "variables", []) or list(getattr(template, "ranges", {}) or {}))
        texts: list[str] = []
        for field in ("equations", "conditions", "relations"):
            texts.extend(getattr(template, field, []) or [])
        for field in ("expression", "objective", "statement", "lhs", "rhs", "divisor"):
            value = getattr(template, field, None)
            if value:
                texts.append(value)
        label = f"part '{part.label}'" if part.label else "the problem"
        if isinstance(template, GeometryTemplate):
            from ..geometry.engine import GeometryError, compile_spec

            try:
                compile_spec(template.spec)
            except GeometryError as exc:
                problems.append(f"{label}: geometry spec is invalid ({exc}).")
            continue
        if isinstance(template, CountTemplate):
            for var, bounds in template.ranges.items():
                if len(bounds) != 2 or bounds[0] > bounds[1]:
                    problems.append(f"{label}: range of {var} must be [low, high]")
        for text in texts:
            try:
                parse(text, names)
            except ExpressionError as exc:
                problems.append(f"{label}: '{text}' is not valid ({exc}). Use only the variables {sorted(names)}, "
                                "explicit operators, and no sets, words or 'in'.")
    return problems


def drop_invalid_templates(formalization: Formalization) -> Formalization:
    """Keep the parts whose templates parse; the others become template=None (→ UNVERIFIED, never guessed)."""
    parts = []
    for part in formalization.parts:
        single = Formalization(parts=[part])
        parts.append(part if not template_errors(single) else part.model_copy(update={"template": None}))
    return Formalization(parts=parts)
