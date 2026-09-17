import { test } from "node:test";
import assert from "node:assert/strict";
import { GeometrySpecSchema, QuestionExtractionSchema, SolutionSchema, parseAndValidate } from "./schema";

test("parseAndValidate accepts well-formed extraction JSON", () => {
  const raw = JSON.stringify({
    extracted_text: "Solve for x: 2x + 3 = 7",
    subject: "mathematics",
    topic: "linear equations",
    is_geometry: false,
    difficulty: "easy",
    concepts: ["algebra"],
    diagram_required: false,
  });
  const result = parseAndValidate(raw, QuestionExtractionSchema);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.not_a_math_question, false); // default applied
  }
});

test("parseAndValidate strips markdown code fences before parsing", () => {
  const raw = "```json\n" + JSON.stringify({
    extracted_text: "x",
    subject: "mathematics",
    topic: "algebra",
    is_geometry: false,
    difficulty: "easy",
    concepts: [],
    diagram_required: false,
  }) + "\n```";
  const result = parseAndValidate(raw, QuestionExtractionSchema);
  assert.equal(result.ok, true);
});

test("parseAndValidate rejects invalid JSON", () => {
  const result = parseAndValidate("not json at all", QuestionExtractionSchema);
  assert.equal(result.ok, false);
});

test("parseAndValidate rejects JSON that violates the schema", () => {
  const raw = JSON.stringify({ extracted_text: "x" }); // missing required fields
  const result = parseAndValidate(raw, QuestionExtractionSchema);
  assert.equal(result.ok, false);
});

test("parseAndValidate rejects an out-of-range enum (prompt-injection style tampering)", () => {
  const raw = JSON.stringify({
    extracted_text: "x",
    subject: "mathematics",
    topic: "algebra",
    is_geometry: false,
    difficulty: "impossible", // not in enum
    concepts: [],
    diagram_required: false,
  });
  const result = parseAndValidate(raw, QuestionExtractionSchema);
  assert.equal(result.ok, false);
});

test("GeometrySpecSchema requires referenced points to exist structurally (shape only)", () => {
  // Schema validates shape, not cross-references; this documents that segments
  // pointing at undefined point ids pass schema validation and must be
  // tolerated defensively by the renderer.
  const raw = JSON.stringify({
    points: [{ id: "A", x: 10, y: 10 }],
    segments: [{ from: "A", to: "B" }],
  });
  const result = parseAndValidate(raw, GeometrySpecSchema);
  assert.equal(result.ok, true);
});

test("GeometrySpecSchema rejects coordinates outside the 0-100 canvas", () => {
  const raw = JSON.stringify({ points: [{ id: "A", x: 500, y: 10 }] });
  const result = parseAndValidate(raw, GeometrySpecSchema);
  assert.equal(result.ok, false);
});

test("SolutionSchema requires at least one step and a final answer", () => {
  const raw = JSON.stringify({ solution_steps: [], final_answer: "42", explanation: "..." });
  const result = parseAndValidate(raw, SolutionSchema);
  assert.equal(result.ok, false);
});

test("SolutionSchema accepts a well-formed solution", () => {
  const raw = JSON.stringify({
    solution_steps: [{ step_number: 1, description: "Subtract 3 from both sides", math_expression: "2x = 4" }],
    final_answer: "x = 2",
    explanation: "Isolating x reveals its value.",
  });
  const result = parseAndValidate(raw, SolutionSchema);
  assert.equal(result.ok, true);
});
