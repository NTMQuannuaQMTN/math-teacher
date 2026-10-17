import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dropRepeatedSteps } from "../src/solver/pipeline";
import { mockGeometryLesson } from "../src/solver/mock";

describe("a looping lesson", () => {
  it("keeps one copy of each repeated step and redirects hints to it", () => {
    const l = mockGeometryLesson();
    const copy = { ...l.steps[0]!, id: "dup" };
    l.steps.push(copy);
    l.hints[0] = { ...l.hints[0]!, stepId: "dup" };
    const out = dropRepeatedSteps(l);
    expect(out.steps.length).toBe(l.steps.length - 1);
    expect(out.hints[0]!.stepId).toBe(l.steps[0]!.id);
    expect(dropRepeatedSteps(mockGeometryLesson())).toEqual(mockGeometryLesson());
  });
});
