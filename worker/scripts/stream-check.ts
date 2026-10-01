/**
 * End-to-end check of streaming + live progress against a real OpenAI-compatible server (default: the
 * local llama.cpp server). Prints each progress event and the final verification.
 *   npx tsx scripts/stream-check.ts ["problem text"] [--url http://127.0.0.1:8080] [--model name]
 */
import { Agent, setGlobalDispatcher } from "undici";
import { VN_GRADE_9 } from "../src/solver/curriculum";
import { LocalJsonModel } from "../src/solver/localModel";
import { solveProblem } from "../src/solver/pipeline";

setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));
const args = process.argv.slice(2);
const flag = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
const problem = args[0] && !args[0].startsWith("--") ? args[0] : "Giải phương trình $x^2 - 5x + 6 = 0$.";
const model = new LocalJsonModel(flag("url") ?? "http://127.0.0.1:8080", flag("model") ?? "local", { thinking: false });
const started = performance.now();
let last = "";
const r = await solveProblem(model, VN_GRADE_9, problem, {
  signal: AbortSignal.timeout(30 * 60_000),
  log: (m) => console.log(`  log: ${m.slice(0, 160)}`),
  onProgress: (p) => {
    const line = `${p.stage} attempt=${p.attempt} steps=${p.stepsWritten} kind=${p.problemKind ?? "-"} strategy=${p.strategy ? `${p.strategy.slice(0, 50)}…` : "-"}`;
    if (line !== last) console.log(`${((performance.now() - started) / 1000).toFixed(1).padStart(6)}s ${line}`);
    last = line;
  },
});
console.log(`RESULT ${r.verification.status} attempts=${r.attempts} ${((performance.now() - started) / 1000).toFixed(1)}s answer=${r.lesson.finalAnswer.text.slice(0, 80)}`);
