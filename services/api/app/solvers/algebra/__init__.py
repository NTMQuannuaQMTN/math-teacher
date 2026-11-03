"""Algebra solver guidance: equations, systems, radicals, identities, inequalities, parameters, extrema."""

GUIDANCE = """Algebra:
- State the conditions for the expressions to be defined (điều kiện xác định) before transforming.
- Prefer the hằng đẳng thức đáng nhớ (a²−b², (a±b)², a³±b³, (a±b)³) to factor before expanding anything.
- When squaring or multiplying by an expression, say why it is non-negative / non-zero, and compare every
  root with the conditions so that extraneous roots are discarded explicitly.
- Quadratics with a parameter (official keys, Hà Nội and Thanh Hóa 2025): first the condition on m from Δ (or Δ')
  ("Để phương trình có hai nghiệm phân biệt thì $\\Delta' > 0 \\Leftrightarrow m > -1$"), then Vi-ét as a system,
  rewrite the required relation in $x_1 + x_2$ and $x_1x_2$, solve for m, and compare every value with the condition:
  "$m = 0$ (thỏa mãn), $m = -1$ (loại). Vậy $m = 0$ thỏa mãn điều kiện bài toán."
- Vi-ét as in the official keys: first why the roots exist ("Vì $\\Delta = 17 > 0$ nên phương trình có hai nghiệm
  phân biệt $x_1, x_2$"), then "Theo định lí Vi-ét: $\\begin{cases} x_1 + x_2 = -\\frac{b}{a} = \\dots \\\\ x_1x_2 =
  \\frac{c}{a} = \\dots \\end{cases}$", then rewrite the target in $x_1 + x_2$ and $x_1x_2$.
- Systems (as in the official keys): state the ĐKXĐ; transform ONE equation (factor it into a product equal to 0,
  or rewrite it in sums/products such as $4x + \\frac{1}{x}$, $4y + \\frac{1}{y}$), split the cases and mark a case that
  breaks the conditions "(không thỏa mãn)"; substitute into the other equation; a sum of squares equal to 0 forces
  each square to be 0; finish with "Vậy hệ có nghiệm $(x; y) = (1; 0)$" listing every pair.
- Parabola (P): y = ax^2 and line (d): "Phương trình hoành độ giao điểm của (P) và (d) là …", solve it, "Với
  x = 1 thì y = -1", then "Vậy tọa độ giao điểm của (P) và (d) là (1; -1) và (2; -4)". Coordinates use a
  semicolon, because the comma is the decimal separator.
- Word problems (giải bài toán bằng cách lập phương trình / hệ phương trình): "Gọi … là $x$ (đơn vị)" with its
  condition ("ĐK: $x > 0$", "$x \\in \\mathbb{N}$"); express the other quantities; set up and solve the equation;
  mark each value "(thỏa mãn điều kiện)" / "(nhận)" or "(loại)"; finish with "Vậy …" answering the question in
  words, with units.
  Inside a word problem the routine equation or system may be solved in one line, as the official keys do
  ("Giải phương trình ta được $x_1 = 20$ (nhận), $x_2 = \\frac{13}{9}$ (loại)"); show full working only when
  solving the equation is itself the question.
- Inequalities and extrema: transform equivalently or use Cô-si / Bunhiacopxki; always state when equality
  holds and check it is attainable under the constraints.
- The official keys prefer the elementary forms: xy ≤ ((x + y)/2)^2 ("3x(2 - 3x) ≤ ((3x + 2 - 3x)/2)^2"),
  3(a^2 + b^2 + c^2) ≥ (a + b + c)^2 ≥ 3(ab + bc + ca), stated with "Ta chứng minh được" (or a one-line proof
  from squares ≥ 0). Equality case as an equation: "khi 3x = 2 - 3x ⇒ x = 1/3".
- Sums of analogous terms: prove the bound for one term (1), write "Tương tự, ta có" for (2) and (3), then "Cộng
  vế theo vế các BĐT (1), (2) và (3)". Finish an extremum with the equality case and "Vậy giá trị nhỏ nhất của P
  là …" (or lớn nhất).
- List every solution explicitly; never write "hoán vị vòng quanh".
"""
