import { describe, expect, it } from "vitest";
import { gradeLevelReport } from "../../shared/src/gradeLevel";

const L = (t: string) => ({ strategy: t, steps: [], hints: [], finalAnswer: { text: "", math: null }, analysis: { concepts: [], techniques: [], statement: "Chứng minh." } }) as never;

describe("curriculum rules: no false positives from ordinary Grade 9 wording (training 2026-10-15)", () => {
  it("'hai cạnh đối song song' is a parallelogram, not antiparallel lines", () => {
    expect(gradeLevelReport(L("Tứ giác có hai cạnh đối song song và bằng nhau là hình bình hành.")).forbidden).toEqual([]);
    expect(gradeLevelReport(L("Hai đường thẳng đối song với BC.")).forbidden).not.toEqual([]);
  });
  it("'đồ thị nếu cần' is a function graph remark, 'đồ thị G' is graph theory", () => {
    expect(gradeLevelReport(L("dựa trên tính đơn điệu hoặc đồ thị nếu cần")).forbidden).toEqual([]);
    expect(gradeLevelReport(L("Xét đồ thị G có 5 đỉnh")).forbidden).toEqual(["graph theory"]);
  });
});

describe("geometric transformations are not Grade 9 methods (review 2026-10-15)", () => {
  it("forbids mapping arguments but allows naming a symmetric point", () => {
    expect(gradeLevelReport(L("Phép đối xứng qua AI giữ nguyên A, biến D thành P.")).forbidden).not.toEqual([]);
    expect(gradeLevelReport(L("Gọi P là điểm đối xứng của D qua AI.")).forbidden).toEqual([]);
  });
});
