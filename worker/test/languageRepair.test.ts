import { describe, expect, it } from "vitest";
import { repairLanguage } from "../src/solver/languageRepair";
import { algebraProofLesson } from "../src/solver/algebraProofLesson";
import type { JsonModel } from "../src/solver/llm";

const lesson = () =>
  algebraProofLesson(
    "Giải phương trình $x^2-5x+6=0$.",
    "Phương trình bậc hai",
    "Dùng công thức nghiệm.",
    [
      { title: "Tính biệt thức", explanation: "We compute the discriminant $\\Delta=25-24=1$ for this condition.", math: "\\Delta=1", reason: "Công thức nghiệm", question: "Biệt thức bằng bao nhiêu?" },
      { title: "Kết luận", explanation: "Phương trình có hai nghiệm $x=2$ và $x=3$.", math: null, reason: "Công thức nghiệm", question: "Nghiệm là gì?" },
    ],
    "Vậy $x=2$ hoặc $x=3$.",
  )!;
const answering = (rewrite: (t: string) => string): JsonModel => ({
  name: "fake",
  model: "fake",
  complete: async ({ messages }) => {
    const items = JSON.parse(messages[1]!.content).items as { id: string; text: string }[];
    return JSON.stringify({ items: items.map((i) => ({ id: i.id, text: rewrite(i.text) })) });
  },
});
const signal = AbortSignal.timeout(5000);

describe("language repair keeps the mathematics", () => {
  it("accepts a Vietnamese rewrite with identical formulas and numbers", async () => {
    const fixed = await repairLanguage(lesson(), answering(() => "Ta tính biệt thức $\\Delta=25-24=1$ theo điều kiện này."), signal);
    expect(fixed?.steps[0]!.explanation).toBe("Ta tính biệt thức $\\Delta=25-24=1$ theo điều kiện này.");
  });
  it("rejects a rewrite that changes a formula", async () => {
    expect(await repairLanguage(lesson(), answering(() => "Ta tính biệt thức $\\Delta=25-24=2$ theo điều kiện này."), signal)).toBeNull();
  });
  it("rejects a rewrite that changes a number in the prose", async () => {
    const l = lesson();
    l.steps[0]!.explanation = "We have 2 roots, so $\\Delta>0$.";
    expect(await repairLanguage(l, answering(() => "Ta có 3 nghiệm, nên $\\Delta>0$."), signal)).toBeNull();
  });
  it("rejects a rewrite that is still not Vietnamese", async () => {
    expect(await repairLanguage(lesson(), answering((t) => t), signal)).toBeNull();
  });
});

import { dropForeignMetadata } from "../src/solver/languageRepair";
describe("leftover foreign metadata", () => {
  it("removes optional labels and restated statement data, never the solution text", () => {
    const l = lesson();
    l.analysis.concepts = ["Phương trình bậc hai", "Definition of roots"];
    l.analysis.givens = ["$x^2-5x+6=0$ where x is real"];
    l.steps[0]!.operation = "analysis";
    const { lesson: out, dropped } = dropForeignMetadata(l);
    expect(dropped).toBe(3);
    expect(out.analysis.concepts).toEqual(["Phương trình bậc hai"]);
    expect(out.steps[0]!.operation).toBeNull();
    // The statement is shown verbatim; a restated given still in English is dropped, not used to discard the lesson.
    expect(out.analysis.givens).toEqual([]);
    expect(out.steps[0]!.explanation).toBe(l.steps[0]!.explanation);
  });
});
