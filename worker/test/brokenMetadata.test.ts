import { describe, expect, it } from "vitest";
import { dropBrokenMetadata, latexFeedback } from "../src/solver/latexCheck";
import { mockGeometryLesson } from "../src/solver/mock";

describe("broken optional metadata", () => {
  it("drops a broken interpretation note instead of the lesson", () => {
    const l = mockGeometryLesson();
    l.analysis.interpretationNotes = ["Ghi chú tốt $x=1$", "\\$\\Del"];
    expect(latexFeedback(l).length).toBeGreaterThan(0);
    const out = dropBrokenMetadata(l);
    expect(out.analysis.interpretationNotes).toEqual(["Ghi chú tốt $x=1$"]);
    expect(latexFeedback(out)).toEqual([]);
  });
});
