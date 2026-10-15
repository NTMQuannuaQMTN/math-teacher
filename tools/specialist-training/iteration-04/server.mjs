import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
const dir = "/tmp/math-teacher-specialist-iteration-04";
const port = Number(process.env.ITERATION04_PORT || 8804);
mkdirSync(dir, { recursive: true, mode: 0o700 });
const bundle = `${dir}/worker.mjs`;
const built = spawnSync(resolve("worker/node_modules/esbuild/bin/esbuild"), [
  "worker/src/index.ts", "--bundle", "--format=esm", "--platform=browser", "--target=es2022",
  "--conditions=workerd,worker,browser", "--external:cloudflare:*", "--external:node:*", `--outfile=${bundle}`,
], { stdio: "inherit" });
if (built.status !== 0) process.exit(built.status ?? 1);
const auditBuilt = spawnSync(resolve("worker/node_modules/esbuild/bin/esbuild"), [
  "worker/scripts/lesson-audit.ts", "--bundle", "--format=esm", "--platform=node", "--target=node20",
  "--outfile=tools/specialist-training/iteration-04/lesson-audit.mjs",
], { stdio: "inherit" });
if (auditBuilt.status !== 0) process.exit(auditBuilt.status ?? 1);
let config = readFileSync("worker/wrangler.toml", "utf8")
  .replace('main = "src/index.ts"', `main = "${bundle}"`)
  .replace('migrations_dir = "migrations"', `migrations_dir = "${root}/worker/migrations"`)
  .replace('name = "math-teacher-worker"', 'name = "math-teacher-specialist-iteration-04"')
  .replace('ENVIRONMENT = "production"', 'ENVIRONMENT = "development"')
  .replace('OCR_PROVIDER = "gemini"', 'OCR_PROVIDER = "mock"')
  .replace('SOLVER_PROVIDER = "gemini"', 'SOLVER_PROVIDER = "local"')
  .replace(/SOLVE_LIMIT_PER_DEVICE_PER_HOUR = "\d+"/, 'SOLVE_LIMIT_PER_DEVICE_PER_HOUR = "200"')
  .replace(/OCR_LIMIT_PER_DEVICE_PER_HOUR = "\d+"/, 'OCR_LIMIT_PER_DEVICE_PER_HOUR = "200"')
  .replace(/SOLVE_LIMIT_PER_IP_PER_HOUR = "\d+"/, 'SOLVE_LIMIT_PER_IP_PER_HOUR = "10000"')
  .replace(/OCR_LIMIT_PER_IP_PER_HOUR = "\d+"/, 'OCR_LIMIT_PER_IP_PER_HOUR = "10000"');
writeFileSync(`${dir}/wrangler.toml`, config);
writeFileSync(`${dir}/.dev.vars`, [
  "IMAGE_URL_SECRET=iteration-04-local-only",
  "SOLVER_GEMINI_FALLBACK=off",
  "SOLVER_SOCLAAS_FALLBACK=off",
  "SOLVER_TWO_STAGE=off",
  "SOLVE_TIMEOUT_MS=29000",
  "SOLVE_BACKGROUND_MS=29000",
  "LOCAL_LLM_URL=http://127.0.0.1:1/v1",
  "LOCAL_SOLVER_MODEL=unavailable",
  "",
].join("\n"), { mode: 0o600 });
writeFileSync("tools/specialist-training/iteration-04/server-snapshot.json", JSON.stringify({
  createdAt: new Date().toISOString(), bundleSha256: createHash("sha256").update(readFileSync(bundle)).digest("hex"),
  port, ocrProvider: "mock", externalInference: "disabled", state: "isolated",
}, null, 2) + "\n");
const cli = resolve("worker/node_modules/.bin/wrangler");
const base = ["--config", `${dir}/wrangler.toml`];
const migrated = spawnSync(cli, [...base, "d1", "migrations", "apply", "math_teacher_db", "--local", "--persist-to", `${dir}/state`], {
  stdio: "inherit", env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
});
if (migrated.status !== 0) process.exit(migrated.status ?? 1);
const child = spawn(cli, [...base, "dev", "--port", String(port), "--persist-to", `${dir}/state`], {
  stdio: "inherit", env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
});
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("exit", (code) => process.exit(code ?? 0));
