/** Debug: solves one dataset item with the hosted solver and prints each raw response summary (status, finish reason, token usage, lengths). Never prints the key.  npx tsx scripts/probe-hosted.ts <id> */
import { readFileSync } from "node:fs";
import { Agent, setGlobalDispatcher } from "undici";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { LocalJsonModel } from "../src/solver/localModel";
import { solveProblem } from "../src/solver/pipeline";
setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));
const key = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split("\n").find((l) => l.startsWith("LOCAL_LLM_API_KEY="))!.slice(18).trim();
const item = readFileSync(new URL("../../tools/benchmark/dataset/problems.jsonl", import.meta.url), "utf8").trim().split("\n").map((l) => JSON.parse(l)).find((i) => i.id === process.argv[2]);
const real = globalThis.fetch;
globalThis.fetch = async (u: any, init: any) => {
  const t = Date.now();
  const r = await real(u, init);
  const j = await r.clone().json().catch(() => null);
  const c = j?.choices?.[0];
  console.log(JSON.stringify({ status: r.status, secs: (Date.now() - t) / 1000, finish: c?.finish_reason, native: c?.native_finish_reason, provider: j?.provider, usage: j?.usage, contentLen: c?.message?.content?.length ?? null, reasoningLen: (c?.message?.reasoning ?? c?.message?.reasoning_content ?? "").length, contentHead: (c?.message?.content ?? "").slice(0, 120), err: j?.error?.message?.slice(0, 200) }));
  return r;
};
const m = new LocalJsonModel("https://openrouter.ai/api", "nvidia/nemotron-3-super-120b-a12b:free", { apiKey: key, reasoningEffort: (process.env.REASONING as "minimal" | "low" | undefined) ?? "low" });
try {
  const r = await solveProblem(m, VN_GRADE_9, item.problem_text, { signal: AbortSignal.timeout(15 * 60_000), maxAttempts: 2 });
  console.log("RESULT", r.verification.status, r.attempts);
} catch (e) { console.log("THROW", (e as Error).message); }
