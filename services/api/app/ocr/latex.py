"""Deterministic normalisation and validation of question text containing LaTeX.

Canonical form: Vietnamese text in Unicode NFC, inline math as `$…$`, display math as `$$…$$`.
`\\unclear{…}` marks notation the OCR could not read with certainty; it always blocks confirmation.

The validator is structural (delimiters, braces, environments, \\left/\\right). The browser also renders
with KaTeX, which is the final authority on whether an expression renders.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Literal

Severity = Literal["error", "warning"]

UNCLEAR = "\\unclear"
MAX_TEXT_LENGTH = 20_000


@dataclass(frozen=True)
class LatexIssue:
    code: str
    severity: Severity
    message: str


@dataclass(frozen=True)
class Segment:
    # "raw" is the unparseable remainder after an unclosed delimiter; it is kept verbatim.
    kind: Literal["text", "math", "raw"]
    content: str
    display: bool = False


@dataclass
class LatexReport:
    text: str
    issues: list[LatexIssue] = field(default_factory=list)

    @property
    def has_errors(self) -> bool:
        return any(i.severity == "error" for i in self.issues)

    @property
    def has_unclear(self) -> bool:
        return UNCLEAR in self.text


# Unicode symbols that must be LaTeX commands inside math mode.
_SYMBOLS: dict[str, str] = {
    "≤": r"\le", "⩽": r"\le", "≥": r"\ge", "⩾": r"\ge", "≠": r"\ne", "≈": r"\approx", "≡": r"\equiv",
    "×": r"\times", "÷": r"\div", "±": r"\pm", "∓": r"\mp", "·": r"\cdot", "⋅": r"\cdot", "−": "-", "–": "-",
    "∞": r"\infty", "π": r"\pi", "α": r"\alpha", "β": r"\beta", "γ": r"\gamma", "δ": r"\delta",
    "Δ": r"\Delta", "ε": r"\varepsilon", "θ": r"\theta", "λ": r"\lambda", "μ": r"\mu", "φ": r"\varphi",
    "ω": r"\omega", "Ω": r"\Omega", "σ": r"\sigma", "ρ": r"\rho",
    "∠": r"\angle", "△": r"\triangle", "∆": r"\triangle", "⊥": r"\perp", "∥": r"\parallel", "//": r"\parallel",
    "°": r"^\circ", "∈": r"\in", "∉": r"\notin", "⊂": r"\subset", "⊆": r"\subseteq", "∪": r"\cup",
    "∩": r"\cap", "∅": r"\varnothing", "∀": r"\forall", "∃": r"\exists", "⋮": r"\,\vdots\,",
    "∑": r"\sum", "∏": r"\prod", "→": r"\to", "⇒": r"\Rightarrow", "⇔": r"\Leftrightarrow",
    "⟺": r"\Leftrightarrow", "⟹": r"\Rightarrow", "←": r"\leftarrow", "∼": r"\sim", "≅": r"\cong",
    "∽": r"\backsim", "′": "'", "″": "''", "…": r"\ldots", "⋯": r"\cdots", "∣": r"\mid", "∤": r"\nmid",
    "⌊": r"\lfloor", "⌋": r"\rfloor", "⌈": r"\lceil", "⌉": r"\rceil", "ℕ": r"\mathbb{N}", "ℤ": r"\mathbb{Z}",
    "ℚ": r"\mathbb{Q}", "ℝ": r"\mathbb{R}",
}
# `//` is a common Vietnamese way of writing "song song" but is also legitimate text; only map inside math.
_TEXT_SAFE_SYMBOLS = {k: v for k, v in _SYMBOLS.items() if k not in {"//", "–", "·", "…", "′", "″", "°"}}
_SUPERSCRIPTS = {"⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8",
                 "⁹": "9", "ⁿ": "n", "⁺": "+", "⁻": "-"}
_SUBSCRIPTS = {"₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8",
               "₉": "9", "ₙ": "n"}

ALLOWED_ENVIRONMENTS = {
    "cases", "dcases", "rcases", "array", "matrix", "pmatrix", "bmatrix", "vmatrix", "Vmatrix", "aligned",
    "alignedat", "gathered", "split", "align", "align*", "gather", "gather*", "equation", "equation*",
    "smallmatrix", "subarray", "CD",
}

# Commands known to render in KaTeX. Unknown commands are reported as warnings (KaTeX decides).
KNOWN_COMMANDS = set("""
alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi varpi rho
varrho sigma varsigma tau upsilon phi varphi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi
Omega frac dfrac tfrac cfrac sqrt overline underline widehat hat bar vec overrightarrow overleftarrow
overleftrightarrow overset underset stackrel left right middle big Big bigg Bigg bigl bigr Bigl Bigr biggl biggr
quad qquad cdot cdots ldots dots dotsc dotsb vdots ddots times div pm mp le leq ge geq ne neq lt gt approx equiv
pmod bmod mod pod sim simeq cong backsim propto in notin ni subset subseteq supset supseteq subsetneq cup cap
emptyset varnothing forall exists nexists neg lnot land lor wedge vee Rightarrow Leftarrow Leftrightarrow iff
implies impliedby to rightarrow leftarrow leftrightarrow longrightarrow longleftarrow Longrightarrow
Longleftarrow Longleftrightarrow mapsto infty angle measuredangle triangle perp parallel nparallel circ degree
sum prod int oint lim limsup liminf max min sup inf log ln lg exp sin cos tan cot sec csc arcsin arccos arctan
gcd lcm deg det operatorname binom dbinom tbinom choose lfloor rfloor lceil rceil langle rangle lvert rvert
lVert rVert vert Vert mid nmid backslash text textbf textit textrm textnormal mbox mathrm mathbf mathit mathbb
mathcal mathscr mathfrak mathsf mathtt boldsymbol pmb bm boxed color textcolor colorbox phantom hphantom
vphantom hline cline begin end displaystyle textstyle scriptstyle limits nolimits prime star ast bullet oplus
ominus otimes odot overbrace underbrace cdotp colon smallsetminus setminus therefore because nless ngtr
leqslant geqslant nleq ngeq ll gg tag notag nonumber widetilde tilde dot ddot breve check acute grave frown
smile square blacksquare Box diamond lozenge triangleleft triangleright bigtriangleup bigtriangledown
overgroup undergroup overparen underparen hspace vspace kern mkern mskip space nobreakspace enspace thinspace
medspace thickspace negthinspace negmedspace negthickspace not cancel bcancel xcancel sout underline uline
dagger ddagger S P aleph hbar ell wp Re Im partial nabla top bot vdash dashv models flat sharp natural
clubsuit diamondsuit heartsuit spadesuit checkmark uparrow downarrow updownarrow Uparrow Downarrow
Updownarrow nearrow searrow swarrow nwarrow hookrightarrow hookleftarrow rightleftharpoons leftrightarrows
xrightarrow xleftarrow xRightarrow xLeftarrow lbrace rbrace lbrack rbrack textdegree circledcirc odot
bigcup bigcap bigoplus bigotimes coprod iint iiint unclear
""".split())

_COMMAND = re.compile(r"\\([A-Za-z]+)")
_ENV = re.compile(r"\\(begin|end)\s*\{([^}]*)\}")


def _replace_scripts(text: str, table: dict[str, str], marker: str) -> str:
    def repl(match: re.Match[str]) -> str:
        return f"{marker}{{{''.join(table[c] for c in match.group(0))}}}"

    return re.sub("[" + "".join(map(re.escape, table)) + "]+", repl, text)


def _convert_sqrt(math: str, issues: list[LatexIssue]) -> str:
    out: list[str] = []
    i = 0
    while i < len(math):
        ch = math[i]
        if ch != "√":
            out.append(ch)
            i += 1
            continue
        j = i + 1
        while j < len(math) and math[j] == " ":
            j += 1
        if j < len(math) and math[j] in "({":
            closer = ")" if math[j] == "(" else "}"
            depth, k = 0, j
            while k < len(math):
                if math[k] == math[j]:
                    depth += 1
                elif math[k] == closer:
                    depth -= 1
                    if depth == 0:
                        break
                k += 1
            if k < len(math):
                out.append(r"\sqrt{" + math[j + 1:k] + "}")
                i = k + 1
                continue
        else:
            m = re.match(r"\d+(?:[.,]\d+)?|[A-Za-z]|\\[A-Za-z]+", math[j:])
            if m:
                out.append(r"\sqrt{" + m.group(0) + "}")
                i = j + len(m.group(0))
                continue
        issues.append(LatexIssue("unicode_sqrt", "error",
                                 "Không xác định được phạm vi của dấu căn √. Hãy viết lại bằng \\sqrt{...}."))
        out.append(ch)
        i += 1
    return "".join(out)


def _normalize_math(math: str, issues: list[LatexIssue]) -> str:
    math = _replace_scripts(math, _SUPERSCRIPTS, "^")
    math = _replace_scripts(math, _SUBSCRIPTS, "_")
    math = _convert_sqrt(math, issues)
    out: list[str] = []
    i = 0
    while i < len(math):
        two = math[i:i + 2]
        if two == "//":
            out.append(r"\parallel ")
            i += 2
            continue
        ch = math[i]
        repl = _SYMBOLS.get(ch)
        if repl is None:
            out.append(ch)
        else:
            # Keep a following letter from fusing with the command name (\le x, not \lex).
            nxt = math[i + 1] if i + 1 < len(math) else ""
            out.append(repl + (" " if repl[-1].isalpha() and (nxt.isalnum()) else ""))
        i += 1
    return re.sub(r"[ \t]+", " ", "".join(out)).strip()


def split_segments(text: str) -> tuple[list[Segment], list[LatexIssue]]:
    """Split into text and math segments. Accepts $…$, $$…$$, \\(…\\) and \\[…\\]."""
    segments: list[Segment] = []
    issues: list[LatexIssue] = []
    buf: list[str] = []
    i = 0
    n = len(text)

    def flush_text() -> None:
        if buf:
            segments.append(Segment("text", "".join(buf)))
            buf.clear()

    while i < n:
        ch = text[i]
        if ch == "\\" and i + 1 < n and text[i + 1] in "$%":
            buf.append(text[i:i + 2])
            i += 2
            continue
        opener: tuple[str, str, bool] | None = None
        if text.startswith("$$", i):
            opener = ("$$", "$$", True)
        elif ch == "$":
            opener = ("$", "$", False)
        elif text.startswith("\\(", i):
            opener = ("\\(", "\\)", False)
        elif text.startswith("\\[", i):
            opener = ("\\[", "\\]", True)
        if opener is None:
            buf.append(ch)
            i += 1
            continue
        start, end, display = opener
        j = i + len(start)
        close = -1
        while j < n:
            if text[j] == "\\" and j + 1 < n and text[j + 1] == "$":
                j += 2
                continue
            if text.startswith(end, j):
                close = j
                break
            j += 1
        if close == -1:
            issues.append(LatexIssue("unclosed_math", "error",
                                     f"Thiếu ký hiệu đóng công thức “{end}”."))
            flush_text()
            segments.append(Segment("raw", text[i:]))
            i = n
            break
        flush_text()
        segments.append(Segment("math", text[i + len(start):close], display))
        i = close + len(end)
    flush_text()
    return segments, issues


def _check_math(math: str, issues: list[LatexIssue]) -> None:
    depth = 0
    i = 0
    while i < len(math):
        ch = math[i]
        if ch == "\\":
            i += 2
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth < 0:
                break
        i += 1
    if depth != 0:
        issues.append(LatexIssue("unbalanced_braces", "error", "Dấu ngoặc nhọn { } không cân đối."))

    lefts = len(re.findall(r"\\left(?![A-Za-z])", math))
    rights = len(re.findall(r"\\right(?![A-Za-z])", math))
    if lefts != rights:
        issues.append(LatexIssue("unbalanced_left_right", "error", "Số lệnh \\left và \\right không bằng nhau."))

    stack: list[str] = []
    for kind, name in _ENV.findall(math):
        if kind == "begin":
            if name not in ALLOWED_ENVIRONMENTS:
                issues.append(LatexIssue("unknown_environment", "error", f"Môi trường “{name}” không được hỗ trợ."))
            stack.append(name)
        elif not stack or stack.pop() != name:
            issues.append(LatexIssue("mismatched_environment", "error",
                                     f"\\begin và \\end không khớp ở môi trường “{name}”."))
            return
    if stack:
        issues.append(LatexIssue("unclosed_environment", "error", f"Thiếu \\end{{{stack[-1]}}}."))

    unknown = sorted({c for c in _COMMAND.findall(math) if c not in KNOWN_COMMANDS})
    if unknown:
        issues.append(LatexIssue("unknown_command", "warning",
                                 "Lệnh có thể không hiển thị được: " + ", ".join("\\" + c for c in unknown[:8])))
    if not math.strip():
        issues.append(LatexIssue("empty_math", "warning", "Có công thức rỗng."))


def normalize_latex(raw: str) -> LatexReport:
    """Normalise to canonical form and report structural problems. Idempotent."""
    issues: list[LatexIssue] = []
    text = unicodedata.normalize("NFC", raw).replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\u00a0", " ").replace("\u200b", "")
    if len(text) > MAX_TEXT_LENGTH:
        issues.append(LatexIssue("too_long", "error", f"Nội dung dài quá {MAX_TEXT_LENGTH} ký tự."))
        text = text[:MAX_TEXT_LENGTH]

    segments, split_issues = split_segments(text)
    issues.extend(split_issues)
    parts: list[str] = []
    for segment in segments:
        if segment.kind == "raw":
            parts.append(segment.content)
            continue
        if segment.kind == "math":
            math = _normalize_math(segment.content, issues)
            _check_math(math, issues)
            parts.append(f"$${math}$$" if segment.display else f"${math}$")
            continue
        content = segment.content
        stray = [c for c in _COMMAND.findall(content) if c != "unclear"]
        if stray:
            issues.append(LatexIssue("command_outside_math", "error",
                                     "Lệnh LaTeX nằm ngoài dấu $...$: " + ", ".join("\\" + c for c in stray[:5])))
        # Math symbols typed as plain text become inline math.
        content = _replace_scripts(content, _SUPERSCRIPTS, "\x00^")
        content = _replace_scripts(content, _SUBSCRIPTS, "\x00_")
        if "\x00" in content:
            # A preceding backslash would escape the opening "$": separate it with a space.
            content = re.sub(r"(\\?)\x00([\^_]\{[^}]*\})",
                             lambda m: (m.group(1) + " " if m.group(1) else "") + f"${m.group(2)}$", content)
            issues.append(LatexIssue("math_outside_delimiters", "warning",
                                     "Có chỉ số/số mũ nằm ngoài công thức; đã tự đặt vào $...$, hãy kiểm tra lại."))
        converted: list[str] = []
        for ch in content:
            sym = _TEXT_SAFE_SYMBOLS.get(ch)
            if sym is None:
                converted.append(ch)
            else:
                # A preceding backslash would escape the opening "$".
                converted.append((" " if converted and converted[-1].endswith("\\") else "") + f"${sym}$")
        content = "".join(converted)
        if "√" in content:
            issues.append(LatexIssue("unicode_sqrt", "error", "Dấu căn √ nằm ngoài công thức. Hãy viết $\\sqrt{...}$."))
        content = re.sub(r"[ \t]+", " ", content)
        content = re.sub(r" *\n *", "\n", content)
        parts.append(content)

    text = "".join(parts)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        issues.append(LatexIssue("empty", "error", "Nội dung câu hỏi đang trống."))
    if UNCLEAR in text:
        issues.append(LatexIssue("unclear_notation", "error",
                                 "Có ký hiệu chưa đọc rõ (đánh dấu vàng). Hãy sửa lại cho đúng đề gốc."))
    # De-duplicate while preserving order.
    seen: set[tuple[str, str]] = set()
    unique: list[LatexIssue] = []
    for issue in issues:
        key = (issue.code, issue.message)
        if key not in seen:
            seen.add(key)
            unique.append(issue)
    return LatexReport(text=text, issues=unique)
