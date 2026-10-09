import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeProblemText } from "../../shared/src/mathText";
import { computeAnswer, computeAnswers, formalise, recognise } from "../../shared/src/oracle";

function datasetProblem(id: string): string {
  for (const f of ["chuyen.jsonl", "problems.jsonl"])
    for (const line of readFileSync(new URL(`../../tools/benchmark/dataset/${f}`, import.meta.url), "utf8").trim().split("\n")) {
      const d = JSON.parse(line) as { id: string; problem_text: string };
      if (d.id === id) return normalizeProblemText(d.problem_text);
    }
  throw new Error(`no dataset problem ${id}`);
}

describe("compute-first answers (no model)", () => {
  it("finds all integer solutions of a Diophantine equation in the search box", () => {
    const r = computeAnswer(datasetProblem("hanoi-2025-chuyen_II.2"))!;
    expect(r.formal.kind).toBe("integer_solutions");
    expect(r.solutions!.map((s) => `${s.x},${s.y}`).sort()).toEqual(["-2,-3", "-7,-14", "4,7"]);
  });

  it("solves an equation with fourth roots: exactly the roots 0 and 1", () => {
    const r = computeAnswer(datasetProblem("khtn-2025-vong2_I.1"))!;
    expect(r.solutions!.map((s) => s.x)).toEqual([0, 1]);
  });

  it("solves a symmetric 3×3 system, recognising √2/2", () => {
    const r = computeAnswer(datasetProblem("ptnk-2024-chuyen_1.1"))!;
    expect(r.solutions).toHaveLength(3);
    expect(r.summary).toContain("√2");
  });

  it("describes an infinite integer answer by its period (each part separately)", () => {
    const parts = computeAnswers(datasetProblem("ch-3"));
    expect(parts.map((p) => [p.part, p.result.answer])).toEqual([
      ["b", "n chia 3 dư 1"],
      ["c", "n chia 18 dư 16"],
    ]);
  });

  it("finds a minimum under a constraint, and a constant value", () => {
    expect(computeAnswer(datasetProblem("hanoi-2025-chuyen_III.1b"))!.answer).toBe("8");
    expect(computeAnswer(datasetProblem("hcm-2025-chuyen_1a"))!.answer).toBe("8");
    expect(computeAnswer(datasetProblem("hanoi-2025-chuyen_I.2"))!.answer).toBe("0");
  });

  it("checks an inequality and finds where equality holds", () => {
    const r = computeAnswer(datasetProblem("ptnk-2024-chuyen_2"))!;
    expect(r.formal.kind).toBe("inequality");
    expect(r.summary).toContain("(a, b, c) = (1; 1; 1)");
  });

  it("says nothing rather than guess: geometry, parameters, number-theory proofs", () => {
    expect(computeAnswers(datasetProblem("ch-2"))).toEqual([]); // a quadrilateral: points are not numbers
    expect(formalise(datasetProblem("ch-1"))).toBeNull(); // a and b are parameters
    expect(computeAnswer(datasetProblem("ptnk-2023-chuyen_4a"))).toBeNull(); // "a là số lẻ"
  });

  it("recognises exact values", () => {
    expect(recognise(0.5)).toBe("1/2");
    expect(recognise(Math.SQRT1_2)).toBe("(√2)/2");
    expect(recognise(1 + Math.sqrt(3))).toBe("1 + √3");
  });
});
