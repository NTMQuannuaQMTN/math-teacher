// Symbols offered by the input symbol bar (components/MathInput.tsx). Pure data, unit-tested.
import type { Snippet } from "./math-insert.ts";

// `label` is plain text; `tex` (when set) is rendered with KaTeX instead, for notation Unicode cannot show.
export type MathSymbol = Snippet & { label: string; name: string; tex?: string };

// Notation from the official answer keys of past entrance papers (see docs/NOTATION.md): ⋮ not a|b, a hat over
// the angle not ∠, // not ∥; no ∞, ≈, ∅, ⊂. Grouped so the bar stays one short row on a phone.
export const GROUPS: { name: string; symbols: MathSymbol[] }[] = [
  {
    name: "Cơ bản",
    symbols: [
      { label: "x²", name: "bình phương", before: "^{2}" },
      { label: "xⁿ", name: "lũy thừa", before: "^{", after: "}" },
      { label: "√", name: "căn bậc hai", before: "\\sqrt{", after: "}" },
      { label: "∛", name: "căn bậc ba", before: "\\sqrt[3]{", after: "}" },
      { label: "a⁄b", name: "phân số", before: "\\frac{", after: "}{}" },
      { label: "|x|", name: "giá trị tuyệt đối", before: "\\left|", after: "\\right|" },
      { label: "( )", name: "dấu ngoặc", before: "\\left(", after: "\\right)" },
      { label: "±", name: "cộng trừ", before: "\\pm " },
      { label: "·", name: "dấu nhân", before: "\\cdot " },
      { label: "×", name: "dấu nhân kích thước", before: "\\times " },
      { label: "π", name: "pi", before: "\\pi " },
      { label: "{ hệ", name: "hệ phương trình", before: "\\begin{cases} ", after: " \\\\  \\end{cases}" },
      { label: "[ hoặc", name: "hoặc (ngoặc vuông)", before: "\\left[\\begin{array}{l} ", after: " \\\\  \\end{array}\\right." },
    ],
  },
  {
    name: "So sánh, chia hết",
    symbols: [
      { label: "≠", name: "khác", before: "\\neq " },
      { label: "≤", name: "nhỏ hơn hoặc bằng", before: "\\le " },
      { label: "≥", name: "lớn hơn hoặc bằng", before: "\\ge " },
      { label: "⋮", name: "chia hết cho", before: "\\vdots " },
      { label: "không ⋮", tex: "\\not\\vdots", name: "không chia hết cho", before: "\\not\\vdots " },
      { label: "≡", name: "đồng dư", before: "\\equiv " },
      { label: "mod", name: "modulo", before: "\\pmod{", after: "}" },
    ],
  },
  {
    name: "Tập hợp, suy luận",
    symbols: [
      { label: "⇒", name: "suy ra", before: "\\Rightarrow " },
      { label: "⇔", name: "tương đương", before: "\\Leftrightarrow " },
      { label: "∈", name: "thuộc", before: "\\in " },
      { label: "∉", name: "không thuộc", before: "\\notin " },
      { label: "ℕ", name: "tập số tự nhiên", before: "\\mathbb{N}" },
      { label: "ℤ", name: "tập số nguyên", before: "\\mathbb{Z}" },
      { label: "{ }", name: "tập hợp", before: "\\{", after: "\\}" },
    ],
  },
  {
    name: "Hình học",
    symbols: [
      { label: "góc", tex: "\\widehat{ABC}", name: "góc", before: "\\widehat{", after: "}" },
      { label: "△", name: "tam giác", before: "\\triangle " },
      { label: "∽", tex: "\\backsim", name: "đồng dạng", before: "\\backsim " },
      { label: "⊥", name: "vuông góc", before: "\\perp " },
      { label: "//", name: "song song", before: "// " },
      { label: "x°", name: "độ", before: "^{\\circ}" },
      { label: "cung", tex: "\\overset{\\frown}{AB}", name: "cung", before: "\\overset{\\frown}{", after: "}" },
    ],
  },
];
