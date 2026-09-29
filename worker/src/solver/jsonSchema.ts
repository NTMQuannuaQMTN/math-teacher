import { z } from "zod";

/** Keywords OpenAI's strict structured outputs don't accept; zod still enforces them after parsing. */
const DROP = new Set(["$schema", "maxLength", "minLength", "pattern", "maxItems", "minItems", "minimum", "maximum", "format", "default"]);

function strictify(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strictify);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (DROP.has(key)) continue;
    out[key] = strictify(value);
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
