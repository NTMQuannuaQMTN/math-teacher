# Solution schema

Source of truth: [shared/src/solution.ts](../shared/src/solution.ts) (zod). The model's output is constrained by a
JSON Schema derived from it (`toStrictJsonSchema`: every object closed, every property required), then parsed with
zod server-side; a lesson that does not validate is never stored.

## ModelLesson (written by the model, repaired by the verifier)

```
analysis
  statement, language (vi|en|mixed), topic, subtopic, gradeLevel, withinCurriculum
  concepts[]          school concepts, in the student's language
  techniques[]        NEW — knowledge-base technique ids (docs/CURRICULUM_KNOWLEDGE_BASE.md); unknown ids dropped
  givens[], unknowns[], constraints[]
  status              solvable | ambiguous | unsupported | not_a_problem
  statusReason, interpretationNotes[]
strategy              the plan in one or two sentences
hints[]               id, level 1–4, question, cue, explanation, math, stepId, focus[] (figure ids)
steps[]               id, title, explanation, math, reason (theorem used)
                      uses[]          NEW — ids of earlier steps this step relies on (dependencies)
                      geometryActions[] {action: highlight|show, targets[] (figure ids)}
finalAnswer           text, math
answerChecks[]        kind substitute|identity|inequality|value|integers, statements[], assignments[], expected
figure                scale, points[], lines[], circles[], angles[], marks[], checks[] (given|derived)
```

## Verification (computed by the server, never by the model)

```
status        verified | partial | unverified | not_checkable
checks[]      {label, passed}
figureIssue   why the figure was dropped, if it was
steps[]       NEW, optional — per step: {stepId, status, claims}
              checked      every measurable geometric claim in the step holds on the exact figure (claims ≥ 1)
              failed       a claim in the step is false on the figure
              answer       the final step, and an independent answer check passed
              not_checked  nothing in the step is machine-checkable
```

## Compatibility

- `techniques` and `uses` have zod defaults (`[]`), so lessons stored before this change parse unchanged.
- `Verification.steps` is optional; older solutions omit it and the app shows no badge.
- The JSON Schema sent to the model still marks the new fields required (defaults are stripped), so new lessons
  always carry them.

## Repairs and validation of the new fields (`checkLessonStructure`)

| Field | Repair |
|---|---|
| `analysis.techniques` | lower-cased, de-duplicated, ids outside the knowledge base dropped (warning) |
| `step.uses` | only ids of **earlier** steps kept (no forward or self references, no unknown ids) |

## Rendering (app)

- "Tìm hiểu đề bài" shows a **Phương pháp** row with the Vietnamese technique names.
- Each step shows "Dựa vào bước 1, 2" from `uses`, and a badge from `Verification.steps`:
  "Đã kiểm tra trên hình", "Đáp số đã kiểm tra", "Không khớp với hình vẽ" or "Chưa kiểm tra tự động".
