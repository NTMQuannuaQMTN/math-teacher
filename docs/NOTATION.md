# Notation in past-paper solutions

Survey of the solutions to the benchmark papers (2026-10-29). It decides which symbols the input symbol bar
(`apps/web/components/MathInput.tsx`) offers. Every page was read, not just text-extracted: MathType PDFs lose
their symbols on extraction and the KHTN file is a scan.

Sources (the SHA-256 matches `benchmarks/authentic/sources.json` unless noted):

| Source | Kind |
| --- | --- |
| PTNK 2023 đáp án, PTNK 2024 đáp án | **official** answer keys (school) |
| HCM 2025 đáp án và hướng dẫn chấm | **official** marking guide (Sở GD&ĐT) |
| PTNK 2026 hướng dẫn giải | published solution, author not stated |
| Hà Nội 2025 (Chuyên Toán + Chuyên Tin) | teachers' club (CLB Toán Cơ Sở) |
| HCM 2025 lời giải | teachers' club (CLB Toán A1) |
| KHTN 2025 vòng 2 | tutor (Lớp toán thầy Khánh), scanned |

PTNK 2025's answer key could not be downloaded (Google Drive refuses), so it is not included.

## Findings

| Notation | Official keys | Other solutions | Bar |
| --- | --- | --- | --- |
| ⋮ (chia hết) | PTNK 2023, HCM | PTNK 2026, Hà Nội | yes |
| `a \| b` (ước) | never | Hà Nội, A1 | **no** (use ⋮) |
| ⋮ with a slash (không chia hết) | — | KHTN | yes, the ⋮-style negation |
| ≡ … (mod n) | PTNK 2024 | PTNK 2026, KHTN | yes |
| `\|x\|` (giá trị tuyệt đối) | PTNK 2023, HCM | A1 | yes |
| ⇒ ⇔ | all | all | yes |
| { (hệ), [ (hoặc) | all / PTNK 2024, HCM | Hà Nội | yes |
| ∈ ℕ | PTNK 2023 | PTNK 2026, Hà Nội (ℕ*, Z, ∉) | ∈ ∉ ℕ ℤ |
| set braces {1; 2; …; 100} | HCM | A1, Hà Nội | yes |
| angle ABC with a hat (`\widehat{ABC}`) | PTNK 2023, 2024, HCM | PTNK 2026 | yes |
| ∠ABC | never | Hà Nội, A1, KHTN | **no** (use the hat) |
| // (song song) | PTNK 2024, HCM | — | yes |
| ∥ | never | Hà Nội, KHTN | **no** (use //) |
| △ / Δ, ∽ or ∼ (đồng dạng), ⊥, ° (or ^0) | all | all | yes |
| arc over BD (cung) | PTNK 2024 (question) | — | yes |
| · and × (3 × 3, n × n) | HCM (·) | PTNK 2026, Hà Nội | yes |
| ∀ | never | A1 (once) | no |
| ∨ (hoặc) | HCM (once) | — | no ([ or "hoặc" is far more common) |
| ∞, ≈, ∅, ⊂, ℚ, ℝ, ∤, ÷, overline segment | never | never | **no** |

Kept although no paper here needed them, because they are Grade 9 content: √ with index 3 (căn bậc ba), π (độ
dài đường tròn, diện tích hình tròn) and ± (công thức nghiệm).

Style seen throughout: multiplication as "." in the official keys (IB.IC, 3.2^k), "(l)"/"(loại)" and
"(n)"/"(nhận)" after rejected/accepted cases, "TH1:", "đpcm", "(g.g)", "(c.g.c)".
