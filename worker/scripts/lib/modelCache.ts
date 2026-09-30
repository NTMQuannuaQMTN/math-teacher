/**
 * Model response cache for development and benchmarks: an identical request is never sent twice.
 *
 * Key = sha256(model id, variant (thinking level, sampling…), full message list, output schema).
 * The system prompt is part of the messages, so changing the prompt (or PROMPT_VERSION) changes
 * the key and naturally invalidates old entries. Entries are JSON files:
 *   tools/benchmark/cache/<model>/<key>.json  { request, text, usage, latencyMs, createdAt }
 *
 * offline mode: a cache miss throws instead of calling the model — for iterating on the
 * verifier, grader or UI with zero API spend.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { JsonModel } from "../../src/solver/llm";
import type { Usage } from "../../src/solver/pricing";

export const CACHE_DIR = new URL("../../../tools/benchmark/cache/", import.meta.url).pathname;

export class OfflineMiss extends Error {
  constructor(model: string) {
    super(`offline: no cached response for ${model}`);
  }
}

export interface CacheStats {
  hits: number;
  misses: number;
  /** Model time of the calls made through this wrapper (the original latency for cache hits). */
  modelMs: number;
}

export class CachedModel implements JsonModel {
  readonly name: string;
  readonly model: string;
  readonly grammarConstrained?: boolean;

  constructor(
    private readonly inner: JsonModel,
    private readonly variant: string,
    private readonly offline: boolean,
    readonly stats: CacheStats = { hits: 0, misses: 0, modelMs: 0 },
  ) {
    this.name = inner.name;
    this.model = inner.model;
    this.grammarConstrained = inner.grammarConstrained;
  }

  async complete(req: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    const key = createHash("sha256")
      .update(JSON.stringify({ model: this.inner.model, variant: this.variant, messages: req.messages, schema: req.schema }))
      .digest("hex");
    const file = join(CACHE_DIR, this.inner.model.replace(/[^A-Za-z0-9._-]/g, "_"), `${key}.json`);
    if (existsSync(file)) {
      const hit = JSON.parse(readFileSync(file, "utf8")) as { text: string; usage: Usage; latencyMs: number };
      this.stats.hits++;
      this.stats.modelMs += hit.latencyMs;
      req.onUsage?.(hit.usage);
      return hit.text;
    }
    if (this.offline) throw new OfflineMiss(this.inner.model);
    this.stats.misses++;
    let usage: Usage = { input: 0, cachedInput: 0, output: 0, reasoning: 0 };
    const started = Date.now();
    const text = await this.inner.complete({ ...req, onUsage: (u) => ((usage = u), req.onUsage?.(u)) });
    this.stats.modelMs += Date.now() - started;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      JSON.stringify({ model: this.inner.model, variant: this.variant, text, usage, latencyMs: Date.now() - started, createdAt: new Date().toISOString() }),
    );
    return text;
  }
}
