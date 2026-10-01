import { describe, expect, it } from "vitest";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import type { JsonModel } from "../src/solver/llm";
import { solveProblem } from "../src/solver/pipeline";
import { selectTechniques, TECHNIQUE_CARDS, techniqueHints } from "../src/solver/techniques";

const ids = (text: string) => selectTechniques(text).map((c) => c.id);

describe("technique retrieval (method cards)", () => {
  it.each([
    [String.raw`Giải hệ phương trình $\begin{cases}x^3+z^3=y\\ y^3+x^3=z\\ z^3+y^3=x\end{cases}$.`, "tech.subtract_equations"],
    [String.raw`Giải hệ phương trình $\begin{cases}(x+y)\left(4+\frac{1}{xy}\right)=1\\ \ldots\end{cases}$`, "tech.change_of_variables"],
    [String.raw`Cho phương trình $x^2-2(m+1)x+2m=0$ ($m$ là tham số). Chứng minh $x_1^4+x_2^4>\frac92$.`, "alg.vieta_parameter"],
    ["Tìm $n$ để $a_n$ chia hết cho 14.", "nt.divisibility_cases"],
    ["Tìm tất cả cặp số nguyên $(x,y)$ thỏa mãn $2(2x-y)(y-x)^2=15x-7y+7$.", "nt.integer_solutions"],
    ["Cho bảng ô vuông kích thước $2\\times9$ …", "comb.grid"],
    ["Chứng minh tứ giác $BCEF$ nội tiếp đường tròn.", "geo.cyclic_proof"],
    ["Cho tam giác $ABC$ có hai đường cao $AD, CF$ cắt nhau tại $H$. Kẻ đường kính $AK$ của $(O)$. Chứng minh $T, H, K$ thẳng hàng.", "geo.orthocenter_diameter"],
    ["Tính xác suất sao cho các nghiệm của phương trình đều là số nguyên.", "prob.integer_roots"],
  ])("%s → %s", (text, expected) => {
    expect(ids(text)).toContain(expected);
  });

  it("does not mistake geometry or LaTeX \\left for an inequality to prove", () => {
    expect(ids("Cho tam giác $ABC$ ($AB<AC$). Chứng minh $\\widehat{AKE}=\\widehat{AMB}$.")).not.toContain("alg.inequality_proof");
    expect(ids(String.raw`Chứng minh phương trình $\left(\sqrt x-1\right)\left[x^2-2(a+b)x+ab+2\right]=0$ có đúng ba nghiệm.`)).not.toContain("alg.inequality_proof");
  });

  it("does not read 'ước chung lớn nhất' as an extremum problem", () => {
    expect(ids("Ký hiệu $d$ là ước chung lớn nhất của $m$ và $n$. Chứng minh $m=d^2$.")).not.toContain("alg.extremum");
  });

  it("returns at most three cards and nothing for an ordinary problem", () => {
    expect(selectTechniques("Cho tam giác ABC có đường cao AD và đường kính AK; chứng minh tứ giác nội tiếp, thẳng hàng, giá trị nhỏ nhất, chia hết, số chính phương").length).toBeLessThanOrEqual(3);
    expect(techniqueHints("Giải phương trình $2x+3=7$.")).toBe("");
  });

  it("cards name techniques, never a specific answer", () => {
    for (const card of TECHNIQUE_CARDS) expect(card.hint).not.toMatch(/đáp số|kết quả là|= ?-?\d+\/\d+$/u);
  });

  it("adds the cards to the request only when enabled", async () => {
    const seen: string[] = [];
    const model: JsonModel = { name: "local", model: "spy", async complete({ messages }) { seen.push(messages.at(-1)!.content); throw new Error("stop"); } };
    const text = "Tìm $n$ để $a_n$ chia hết cho 14.";
    await solveProblem(model, VN_GRADE_9, text, { signal: new AbortController().signal, maxAttempts: 1 }).catch(() => undefined);
    await solveProblem(model, VN_GRADE_9, text, { signal: new AbortController().signal, maxAttempts: 1, techniqueHints: true }).catch(() => undefined);
    expect(seen[0]).not.toMatch(/Phương pháp thường dùng/);
    expect(seen[1]).toMatch(/Phương pháp thường dùng[\s\S]*modulo/);
  });
});
