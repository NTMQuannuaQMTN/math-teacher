export const EXTRACTION_PROMPT = `You are looking at a photo of a mathematics question, possibly handwritten or from a textbook.

Read the question carefully and respond with ONLY a single JSON object (no markdown fences, no prose) matching exactly this shape:

{
  "extracted_text": string,       // the full question, transcribed as plain text/LaTeX-ish notation
  "subject": "mathematics",
  "topic": string,                // e.g. "quadratic equations", "circle geometry", "trigonometry"
  "is_geometry": boolean,         // true if solving requires reasoning about a geometric figure
  "difficulty": "easy" | "medium" | "hard",
  "concepts": string[],           // key concepts/skills involved, up to ~6
  "diagram_required": boolean,    // true if a diagram would materially help a student understand it
  "not_a_math_question": boolean  // true if the image does NOT contain a math question at all
}

If the image is blurry, cut off, or ambiguous, still make your best-effort transcription and note any uncertainty inline in extracted_text (e.g. "[unclear: 3x or 8x]"). If the image clearly contains no math question, set not_a_math_question to true and fill other fields with your best guess.`;

export const GEOMETRY_PROMPT = (extractedText: string) => `The following geometry question needs an interactive diagram:

"""${extractedText}"""

Respond with ONLY a single JSON object (no markdown fences, no prose) describing a 2D diagram in a normalized 0-100 x 0-100 coordinate space (origin top-left), matching exactly this shape:

{
  "title": string,
  "points": [{ "id": string, "x": number, "y": number, "label": string }],
  "segments": [{ "from": pointId, "to": pointId, "label": string, "style": "solid" | "dashed" }],
  "circles": [{ "center": pointId, "radius": number, "label": string }],
  "polygons": [{ "points": [pointId, ...], "label": string, "fill": boolean }],
  "angles": [{ "vertex": pointId, "from": pointId, "to": pointId, "label": string, "degrees": number }]
}

Only reference point ids that you defined in "points". Place points so the figure is geometrically sensible and readable (not overlapping, using most of the 0-100 canvas). Omit arrays you don't need by returning them empty, but always include all keys.`;

export const SOLVE_PROMPT = (extractedText: string, topic: string) => `Solve this ${topic} problem step by step, the way a patient, clear math teacher would explain it to a student who is seeing this type of problem for the first time:

"""${extractedText}"""

Respond with ONLY a single JSON object (no markdown fences, no prose) matching exactly this shape:

{
  "solution_steps": [
    { "step_number": number, "description": string, "math_expression": string }
  ],
  "final_answer": string,
  "explanation": string  // a short paragraph on WHY this approach works / the intuition, for learning, not just the mechanics
}

Be rigorous and correct. Show enough steps that a student can follow the reasoning, but don't pad with trivial steps.`;
