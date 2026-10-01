/**
 * Generation-speed probe for the solver server: sends one fixed lesson request (dataset item, same
 * prompt + grammar schema as production) with a bounded max_tokens and reports tokens/s, so server
 * settings (speculative decoding, quantisation, …) can be compared on identical work.
 *   npx tsx scripts/gen-speed.ts [--id a2] [--url http://127.0.0.1:8080] [--max-tokens 1200]
 */
import { readFileSync } from "node:fs";
import { z } from "zod";
import { ModelLessonSchema } from "../../shared/src/solution";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { toGrammarJsonSchema, toStrictJsonSchema } from "../src/solver/jsonSchema";
import { buildSystemPrompt, buildUserMessage } from "../src/solver/prompts";

const args = process.argv.slice(2);
const flag = (n: string, d: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1]! : d);
const id = flag("id", "a2");
const url = flag("url", "http://127.0.0.1:8080");
const maxTokens = Number(flag("max-tokens", "1200"));
// grammar: "full" (patterns/limits, production for local models), "strict" (no patterns/limits), "none" (free text)
const grammar = flag("grammar", "full");
const item = readFileSync(new URL("../../tools/benchmark/dataset/problems.jsonl", import.meta.url), "utf8")
  .trim().split("\n").map((l) => JSON.parse(l)).find((i: { id: string }) => i.id === id);
const geometry = item.topic === "geometry";
const zod = geometry ? ModelLessonSchema : ModelLessonSchema.extend({ figure: z.null() });
const schema = grammar === "strict" ? toStrictJsonSchema(zod) : toGrammarJsonSchema(zod);
const started = Date.now();
const res = await fetch(`${url}/v1/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "system", content: buildSystemPrompt(VN_GRADE_9, { withFigure: geometry }) }, { role: "user", content: buildUserMessage(item.problem_text) }],
    max_tokens: maxTokens, temperature: 0, chat_template_kwargs: { enable_thinking: false },
    ...(grammar === "none" ? {} : { response_format: { type: "json_schema", json_schema: { name: "lesson", strict: true, schema } } }),
  }),
});
const body = (await res.json()) as { timings?: Record<string, number>; usage?: Record<string, number> };
const t = body.timings ?? {};
console.log(JSON.stringify({ id, grammar, wallS: (Date.now() - started) / 1000, promptTokens: t.prompt_n, promptMs: Math.round(t.prompt_ms ?? 0), genTokens: t.predicted_n, genTokPerS: Number((t.predicted_per_second ?? 0).toFixed(1)), draftN: t.draft_n, draftAccepted: t.draft_n_accepted }));
