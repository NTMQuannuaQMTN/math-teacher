import { z } from "zod";

/** Keywords OpenAI's strict structured outputs don't accept; zod still enforces them after parsing. */
const DROP = new Set(["$schema", "maxLength", "minLength", "pattern", "maxItems", "minItems", "minimum", "maximum", "format", "default"]);

/**
 * Grammar-based decoders (llama.cpp, vLLM/xgrammar) can enforce these, and small open models need
 * them: without them they emit empty ids, too many items or over-long labels, and the lesson fails
 * validation. Long text limits are left out; a {0,2000} repetition would make the grammar huge.
 */
const GRAMMAR_KEEP = new Set(["pattern", "minLength", "minItems", "maxItems"]);
const SHORT_MAX_LENGTH = 40;

function strictify(node: unknown, grammar = false): unknown {
  if (Array.isArray(node)) return node.map((n) => strictify(n, grammar));
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const keep = grammar && (GRAMMAR_KEEP.has(key) || (key === "maxLength" && typeof value === "number" && value <= SHORT_MAX_LENGTH));
    if (DROP.has(key) && !keep) continue;
    out[key] = strictify(value, grammar);
  }
  if (out.type === "object" && out.properties && typeof out.properties === "object") {
    out.required = Object.keys(out.properties as object);
    out.additionalProperties = false;
  }
  return out;
}

/** JSON Schema for constrained decoding, derived from the zod schema (single source of truth). */
export function toStrictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return strictify(z.toJSONSchema(schema)) as Record<string, unknown>;
}

/** Same schema plus the constraints a grammar-constrained decoder can enforce (see GRAMMAR_KEEP). */
export function toGrammarJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return strictify(z.toJSONSchema(schema), true) as Record<string, unknown>;
}
