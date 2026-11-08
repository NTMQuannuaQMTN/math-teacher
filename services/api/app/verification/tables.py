"""Deterministic check of residue tables in a solution (no model involved).

A finite case check is written as one table (solver rule 7):

    $$\\begin{array}{|c|c|c|}\\hline n \\pmod 9 & 0 & 1 & … \\\\ \\hline A = n+2 \\pmod 9 & 2 & 3 & …
    \\\\ \\hline A \\cdot B \\pmod 9 & … \\end{array}$$

Every cell can be recomputed: the header row gives the variable, the modulus and the residues; each other row's label
is an expression in that variable (or in the names of earlier rows) and, optionally, its own modulus. Seen live
(2026-11-08): one wrong cell (n = 7: n² + 4n + 8 ≡ 4, written 8) that the examiner missed. Rows that cannot be
read exactly (unknown functions, words, non-integer cells) are skipped: this check only reports certain errors.
"""

from __future__ import annotations

import re

import sympy as sp

from ..solvers.schemas import ModelSolution
from ..tools.expr import ExpressionError, parse

_ARRAY = re.compile(r"\\begin\{array\}\{[^}]*\}(.*?)\\end\{array\}", re.S)
_MOD = re.compile(r"\\[pb]mod\s*\{?\s*(\d+)\s*\}?|\(\s*\\?(?:text\{)?mod\}?\s*(\d+)\s*\)|\\mod\s*\{?\s*(\d+)\s*\}?")
_NAME = re.compile(r"^[A-Za-z](?:_\{?\d+\}?)?$")


def _modulus(cell: str) -> tuple[str, int | None]:
    match = _MOD.search(cell)
    if not match:
        return cell, None
    value = next(g for g in match.groups() if g)
    return (cell[:match.start()] + cell[match.end():]), int(value)


def _ascii(latex: str) -> str:
    text = latex.replace("\\left", "").replace("\\right", "")
    text = re.sub(r"\\(?:cdot|times)", "*", text)
    text = re.sub(r"\\frac\{([^{}]*)\}\{([^{}]*)\}", r"((\1)/(\2))", text)
    text = re.sub(r"\\[,;!: ]|\\quad|\\qquad|\$", " ", text)
    text = text.replace("{", "(").replace("}", ")")
    return " ".join(text.split())


def _integer(cell: str) -> int | None:
    text = _ascii(cell).replace(" ", "")
    return int(text) if re.fullmatch(r"[+-]?\d+", text) else None


def _rows(body: str) -> list[list[str]]:
    body = body.replace("\\hline", " ")
    rows = [row for row in re.split(r"\\\\", body) if row.strip()]
    return [[cell.strip() for cell in row.split("&")] for row in rows]


def check_table(body: str) -> list[str]:
    """The wrong cells of one array body, as short Vietnamese descriptions (empty when all readable cells agree)."""
    rows = _rows(body)
    if len(rows) < 2:
        return []
    header_label, modulus = _modulus(rows[0][0])
    variable = _ascii(header_label).strip()
    if modulus is None or not re.fullmatch(r"[A-Za-z]", variable):
        return []
    residues = [_integer(cell) for cell in rows[0][1:]]
    if not residues or any(r is None for r in residues):
        return []
    named: dict[str, list[int]] = {}
    problems: list[str] = []
    for row in rows[1:]:
        if len(row) != len(residues) + 1:
            continue
        label, row_mod = _modulus(row[0])
        mod = row_mod or modulus
        text = _ascii(label)
        name = None
        if "=" in text:
            left, _, right = text.partition("=")
            if _NAME.fullmatch(left.strip()):
                name, text = left.strip(), right
        try:
            expr = parse(text.strip(), {variable, *named})
        except ExpressionError:
            continue
        cells = [_integer(cell) for cell in row[1:]]
        computed: list[int] = []
        readable = True
        for column, residue in enumerate(residues):
            substitutions = {sp.Symbol(variable): residue, **{sp.Symbol(k): v[column] for k, v in named.items()}}
            value = sp.sympify(expr).subs(substitutions)
            if not value.is_integer:
                readable = False
                break
            computed.append(int(value) % mod)
        if not readable:
            continue
        if name:
            named[name] = computed
        for residue, got, want in zip(residues, cells, computed, strict=True):
            if got is not None and got % mod != want:
                problems.append(f"tại ${variable} \\equiv {residue}$, ô của hàng “${row[0].strip()}$” phải là "
                                f"${want}$, không phải ${got}$")
    return problems


def table_defects(solution: ModelSolution) -> list[str]:
    """Wrong cells in the solution's residue tables, as one deterministic defect per table."""
    found: list[str] = []
    for part in solution.parts:
        for index, step in enumerate(part.steps, start=1):
            for match in _ARRAY.finditer(step):
                wrong = check_table(match.group(1))
                if wrong:
                    where = f"{f'ý {part.label} ' if part.label else ''}bước {index}"
                    found.append(f"Bảng ở {where} có ô tính sai: {'; '.join(wrong[:3])}"
                                 f"{' …' if len(wrong) > 3 else ''}. Hãy tính lại từng ô của bảng (rút gọn theo "
                                 "modulo trước khi lũy thừa) và sửa các kết luận dùng bảng.")
    return found


# A step that handles one case of a finite case check: "TH1: …", "Trường hợp 2: …", "Nếu $n \equiv 3 …".
_CASE_STEP = re.compile(r"^\s*(?:TH\s*\d+|Trường hợp\s*\d+|Với|Nếu)\b[^$]{0,12}\$\s*[A-Za-z]\s*(?:\\equiv|=)\s*-?\d+"
                        r"|^\s*(?:TH|Trường hợp)\s*\d+\s*[:.)]", re.IGNORECASE)


def case_list_notes(solution: ModelSolution) -> list[str]:
    """Presentation (never an error): three or more consecutive one-case steps should be one table (solver rule 7)."""
    notes: list[str] = []
    for part in solution.parts:
        run = 0
        for index, step in enumerate([*part.steps, ""], start=1):
            if _CASE_STEP.search(step) and "\\begin{array}" not in step:
                run += 1
                continue
            if run >= 3:
                where = f"{f'ý {part.label} ' if part.label else ''}bước {index - run}–{index - 1}"
                notes.append(f"Trình bày ({where}): {run} trường hợp viết thành từng dòng; hãy gộp thành MỘT bảng "
                             "(mỗi trường hợp một cột, các hàng là giá trị trung gian), rồi kết luận "
                             "\"Từ bảng trên, …\".")
            run = 0
    return notes
