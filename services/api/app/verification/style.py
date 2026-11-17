"""Deterministic presentation checks that ask for a revision (never errors: the mathematics may be correct).

Angles named by a Greek letter. Seen live (2026-11-14): "Gọi $\\widehat{BAC} = \\alpha$, $\\widehat{ABC} = \\beta$ …
Vì $\\widehat{ADC} = 180^\\circ - \\beta$". Official keys write the angle with its points and relate angles directly:
"$\\widehat{ADC} = 180^\\circ - \\widehat{ABC}$".

High-degree expansions in inequalities. Seen live (2026-11-13): to prove $x_1^4 + x_2^4 > \\frac{9}{2}$ the solver
expanded $16(m^2 + m + 1)^2 - 8m^2$ into $16m^4 + 32m^3 + \\dots$ and then hunted for a sum of squares, even with a
prompt rule against it. The exam route lowers the degree first ($x_1^4 + x_2^4 \\ge \\frac{(x_1^2 + x_2^2)^2}{2}$,
Cô-si, Bunhiacopxki) and finishes with a quadratic.
"""

from __future__ import annotations

import re

from ..solvers.schemas import ModelSolution, PartSolution

# A single-letter unknown raised to 4 or more, not a subscripted root ("x_1^4" has "1" before "^").
_HIGH_POWER = re.compile(r"(?<![A-Za-z_\\])([a-z])\s*\^\s*\{?\s*([4-9])\b")
_INEQUALITY = re.compile(r"\\ge|\\le|\\geq|\\leq|[<>≥≤]|lớn nhất|nhỏ nhất|\\max|\\min", re.IGNORECASE)


def _is_inequality_part(part: PartSolution) -> bool:
    if part.answer_kind == "solution_set":
        return False  # solving a quartic equation may need its degree-4 polynomial
    return part.answer_kind == "extremum" or bool(_INEQUALITY.search(part.final_answer_latex))


def _expanded_steps(part: PartSolution) -> tuple[list[int], str | None]:
    found: list[int] = []
    letter: str | None = None
    for index, step in enumerate(part.steps, start=1):
        for match in _HIGH_POWER.finditer(step):
            name = match.group(1)
            # An expansion: the same letter also appears with a lower power (^3, ^2) or alone in the same step.
            if re.search(rf"(?<![A-Za-z_\\]){name}\s*\^\s*\{{?\s*[23]\b", step):
                found.append(index)
                letter = letter or name
                break
    return found, letter


def degree_notes(solution: ModelSolution) -> list[str]:
    notes: list[str] = []
    for part in solution.parts:
        if not _is_inequality_part(part):
            continue
        steps, letter = _expanded_steps(part)
        if not steps:
            continue
        where = f"{f'ý {part.label} ' if part.label else ''}bước {', '.join(map(str, steps[:4]))}"
        notes.append(f"Trình bày ({where}): lời giải khai triển thành đa thức bậc 4 trở lên theo ${letter}$. Hãy hạ "
                     "bậc trước: dùng $a^2 + b^2 \\ge \\frac{(a+b)^2}{2}$ (chẳng hạn $x_1^4 + x_2^4 \\ge "
                     "\\frac{(x_1^2 + x_2^2)^2}{2}$), bất đẳng thức Cô-si hoặc Bunhiacopxki, hay biến đổi theo "
                     "Vi-ét, để chỉ còn biểu thức bậc 2 (nhiều nhất bậc 3), rồi mới đánh giá; nêu rõ khi nào dấu "
                     "bằng xảy ra.")
    return notes


_GREEK = r"\\(?:alpha|beta|gamma|delta|varphi|phi|theta|omega|psi|lambda|mu)\b|[αβγδφθωψλμ]"
# "\widehat{BAC} = \alpha" or "\alpha = \widehat{BAC}" (also \angle, or "góc BAC").
_ANGLE_LETTER = re.compile(rf"(?:\\widehat\{{\w+\}}|\\angle\s*\w+|góc\s+\$?\w+)\s*\$?\s*=\s*\$?\s*(?:{_GREEK})"
                           rf"|(?:{_GREEK})\s*=\s*\\widehat\{{\w+\}}", re.IGNORECASE)


def angle_letter_notes(solution: ModelSolution) -> list[str]:
    """Angles must be written with their points and related directly, never named α, β, γ …"""
    notes: list[str] = []
    for part in solution.parts:
        steps = [i for i, step in enumerate(part.steps, start=1) if _ANGLE_LETTER.search(step)]
        if steps:
            where = f"{f'ý {part.label} ' if part.label else ''}bước {', '.join(map(str, steps[:4]))}"
            notes.append(f"Trình bày ({where}): không đặt tên góc bằng chữ cái như $\\alpha, \\beta, \\gamma$. Hãy "
                         "viết góc bằng các điểm của nó và liên hệ trực tiếp các góc, kèm lý do, ví dụ "
                         "\"$\\widehat{ADC} = 180^\\circ - \\widehat{ABC}$ (tứ giác $ABCD$ nội tiếp)\".")
    return notes


# "\{x, y, z\} = \{1, 2, 3\}" or "\{x, z\} = \{1, 2\}": a set of unknowns equated with a set of values (seen live
# 2026-11-17). Official keys say it in words, or use membership only ("x \in \{1; 2\}").
_SET_EQUATION = re.compile(r"\\\{\s*[A-Za-z](?:_\{?\w+\}?)?(?:\s*[,;]\s*[A-Za-z](?:_\{?\w+\}?)?)+\s*\\\}\s*=\s*\\\{")


def set_equation_notes(solution: ModelSolution) -> list[str]:
    notes: list[str] = []
    for part in solution.parts:
        steps = [i for i, step in enumerate(part.steps, start=1) if _SET_EQUATION.search(step)]
        if steps:
            where = f"{f'ý {part.label} ' if part.label else ''}bước {', '.join(map(str, steps[:4]))}"
            notes.append(f"Trình bày ({where}): không viết đẳng thức giữa hai tập hợp như $\\{{x, y, z\\}} = "
                         "\\{1, 2, 3\\}$. Ký hiệu tập hợp chỉ dùng để nói một phần tử thuộc tập hợp ($x \\in "
                         "\\{1; 2\\}$); hãy diễn đạt bằng lời, ví dụ \"ba số $x, y, z$ là $1, 2, 3$ theo một thứ "
                         "tự nào đó\".")
    return notes
