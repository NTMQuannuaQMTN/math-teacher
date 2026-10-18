import { describe, expect, it } from "vitest";
import { servable } from "../../shared/src/servePolicy";

describe("accuracy first: what a student may be shown", () => {
  it("withholds a lesson with a step or answer the checks found false", () => {
    expect(servable({ status: "unverified", checks: [{ label: "E, C, F thẳng hàng", passed: false }] })).toBe(false);
    expect(servable({ status: "unverified", checks: [{ label: "final answer does not match the machine computation", passed: false }] })).toBe(false);
    expect(servable({ status: "unverified", checks: [{ label: "methods within the curriculum (calculus (derivatives)", passed: false }] })).toBe(false);
  });
  it("serves lessons in which nothing was found false", () => {
    expect(servable({ status: "verified", checks: [] })).toBe(true);
    expect(servable({ status: "not_checkable", checks: [] })).toBe(true);
    expect(servable({ status: "partial", checks: [{ label: "x", passed: true }] })).toBe(true);
    expect(servable({ status: "unverified", checks: [{ label: "Một số công thức chưa hiển thị đầy đủ; cần kiểm tra lại lời giải", passed: false }] })).toBe(true);
  });
});

import { finalStepConflict } from "../../shared/src/servePolicy";
describe("a final answer that contradicts the last step", () => {
  const lesson = (math: string, answer: string) => ({ steps: [{ math: "x" }, { math }], finalAnswer: { text: answer, math: null } });
  it("is caught when the last line states the value", () => {
    expect(finalStepConflict(lesson("P = \\frac{4}{201}", "Xác suất cần tìm là $\\frac{11}{201}$."))).toHaveLength(1);
    expect(finalStepConflict(lesson("P = \\frac{4}{201}", "Xác suất là $\\frac{4}{201}$."))).toEqual([]);
    expect(finalStepConflict(lesson("S_{max} = 18", "Chu vi lớn nhất là $18$."))).toEqual([]);
  });
  it("ignores equations and case lines", () => {
    expect(finalStepConflict(lesson("(2x+2)^2 = 0", "S = {(1;1)}"))).toEqual([]);
    expect(finalStepConflict(lesson("y = \\pm 2: (2x \\pm 2)^2 = 0", "S = {(1;1)}"))).toEqual([]);
  });
  it("catches a counting conclusion that changes the computed total", () => {
    expect(finalStepConflict(lesson("20+16=36\\text{ (số)}", "Vậy lập được 28 số."))).toHaveLength(1);
    expect(finalStepConflict(lesson("20+16=36\\text{ (số)}", "Vậy lập được 36 số."))).toEqual([]);
  });
});
