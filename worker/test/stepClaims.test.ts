import { describe, expect, it } from "vitest";
import { deadEndFeedback, hintFeedback, stepClaimFeedback } from "../../shared/src/stepClaims";

const lesson = (explanation: string, math: string | null = null) => ({ strategy: "", hints: [], finalAnswer: { text: "x", math: null }, steps: [{ explanation, math }] }) as never;

describe("every remainder claim in the steps is checked", () => {
  it("catches wrong remainders in prose and congruence chains", () => {
    expect(stepClaimFeedback(lesson("Ta có $11$ chia $5$ dư $6$."))).toHaveLength(1);
    expect(stepClaimFeedback(lesson("x", "2^{2026} \\equiv 2^2 \\equiv 6 \\pmod{10}"))).toHaveLength(1);
    expect(stepClaimFeedback(lesson("Vì $7^{100}$ chia cho $5$ dư $3$."))).toHaveLength(1); // 7^100 ≡ 1 (mod 5)
  });
  it("accepts correct claims and leaves expressions with letters alone", () => {
    expect(stepClaimFeedback(lesson("Ta có $11$ chia $5$ dư $1$ nên $11^{100}$ chia $5$ dư $1$.", "7 \\equiv 2 \\pmod{5} \\Rightarrow 7^{100} \\equiv 2^{100} \\equiv 1 \\pmod{5}"))).toEqual([]);
    expect(stepClaimFeedback(lesson("x", "n^3 - n \\equiv 0 \\pmod{6}"))).toEqual([]);
  });
  it("rejects the solver's own working in the lesson", () => {
    expect(stepClaimFeedback(lesson("Chờ đã, mình cần kiểm tra lại kết quả từ máy."))).toHaveLength(1);
  });
  it("checks plain arithmetic in the steps (geo8-h4: 180° − 80° = 110° served)", () => {
    expect(stepClaimFeedback(lesson("Ta có", String.raw`C = 180^\circ - 80^\circ = 110^\circ`))).toHaveLength(1);
    expect(stepClaimFeedback(lesson("Ta có", String.raw`C = 180^\circ - 80^\circ = 100^\circ \quad \Delta = 2^2 - 4(1)(-2) = 12`))).toEqual([]);
    // units and words make a different quantity; approximations are not claims of equality
    expect(stepClaimFeedback(lesson("Đổi", String.raw`36 \text{ phút} = \frac{36}{60} \text{ giờ}, \quad 2026 \div 4 = 506 \text{ dư } 2, \quad k \le \frac{80}{7} \approx 11,4`))).toEqual([]);
  });
  it("rejects a guessed answer", () => {
    expect(stepClaimFeedback(lesson("Đề bài thiếu dữ kiện. Giả sử đáp án là 16:00."))).toHaveLength(1);
  });
  it("asks for a rewrite (never withholds) when an abandoned attempt is left in", () => {
    expect(deadEndFeedback(lesson("Thay S vào sẽ rất phức tạp. Ta thử cách khác: …"))).toHaveLength(1);
    expect(deadEndFeedback(lesson("Đặt S = x + y, P = xy."))).toEqual([]);
  });
  it("two lines perpendicular to the same line are parallel, not perpendicular", () => {
    expect(stepClaimFeedback(lesson("Ta có $CF \\bot AB$ và $BK \\bot AB$ nên $CF \\bot BK$."))).toHaveLength(1);
    expect(stepClaimFeedback(lesson("Ta có $CF \\bot AB$ và $BK \\bot AB$ nên $CF \\parallel BK$."))).toEqual([]);
  });
  it("divisibility only between integers (review 2026-10-16)", () => {
    expect(stepClaimFeedback(lesson("Chia cả hai vế cho $n^2$, ta được $k^2 + k/n + 1 \\vdots k$.", "k^2+\\frac{k}{n}+1 \\vdots k"))).not.toEqual([]);
    expect(stepClaimFeedback(lesson("Ta có $k^2n^2 + kn + n^2 \\vdots kn^2$ và $\\frac{n(n+1)}{2} \\vdots 3$.", "n^2 \\vdots k"))).toEqual([]);
  });
  it("hints are statements and never show the final answer (review 2026-10-16)", () => {
    const L = (final: string, hint: string) => ({ analysis: { statement: "Cho tam giác ABC có B = 60°, C = 45°, AH = 6. Tính BC." }, finalAnswer: { text: final, math: null }, hints: [{ id: "h1", question: hint, cue: null, explanation: "", math: null }] }) as never;
    expect(hintFeedback(L("Độ dài $BC$ là $6 + 2\\sqrt{3}$ cm.", "Dùng $\\tan 60^\\circ = \\sqrt3$ trong tam giác $ABH$"))).toEqual([]);
    expect(hintFeedback(L("Độ dài $BC$ là $6 + 2\\sqrt{3}$ cm.", "Ta được $BC = 6+2\\sqrt3$"))).toHaveLength(1);
    expect(hintFeedback(L("x", "Có thể dùng Vi-ét không?"))).toHaveLength(1);
  });
});
