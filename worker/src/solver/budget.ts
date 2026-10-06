import { OcrFailure } from "../ocr/provider";
import type { JsonModel } from "./llm";
import { estimateCost, type Usage } from "./pricing";

/** Worst-case output of one call (the Gemini solver's maxOutputTokens). */
const WORST_CASE_OUTPUT = 65_536;

/**
 * A daily spending cap for a paid model (the temporary Gemini fallback). Spend is kept per UTC day in micro-dollars
 * in the rate_limits table. Before each call the worst case (full output budget) is reserved, so a truncated or
 * failed call can never overshoot; after a call that reports usage, the reservation is corrected to the actual cost.
 * Over the cap, the call is refused as quota_exhausted (the lesson fails like any other unavailable model).
 */
export class BudgetedJsonModel implements JsonModel {
  readonly name: string;
  readonly grammarConstrained?: boolean;

  constructor(
    private readonly inner: JsonModel,
    private readonly db: D1Database,
    private readonly dailyBudgetUsd: number,
    private readonly log: (message: string) => void = () => undefined,
  ) {
    this.name = inner.name;
    this.grammarConstrained = inner.grammarConstrained;
  }

  get model(): string {
    return this.inner.model;
  }

  async complete(input: Parameters<JsonModel["complete"]>[0]): Promise<string> {
    const inputTokens = Math.ceil(input.messages.reduce((n, m) => n + m.content.length, 0) / 3);
    const reserve = toMicro(estimateCost(this.model, { input: inputTokens, cachedInput: 0, output: WORST_CASE_OUTPUT, reasoning: 0 }) ?? 1);
    const day = Math.floor(Date.now() / 86_400_000) * 86_400;
    const bucket = `spend:${this.model}`;
    const spent = await add(this.db, bucket, day, 0);
    if (spent + reserve > toMicro(this.dailyBudgetUsd)) {
      this.log(`${this.model}: daily budget $${this.dailyBudgetUsd} reached ($${(spent / 1e6).toFixed(2)} spent today); not calling it`);
      throw new OcrFailure("quota_exhausted", `${this.model} daily budget reached`, false);
    }
    await add(this.db, bucket, day, reserve);
    let actual: Usage | null = null;
    try {
      return await this.inner.complete({ ...input, onUsage: (u) => ((actual = u), input.onUsage?.(u)) });
    } finally {
      // Correct the reservation to what the call reported; a call without usage keeps the worst case.
      const used = actual ? toMicro(estimateCost(this.model, actual) ?? 0) : reserve;
      const total = await add(this.db, bucket, day, used - reserve);
      this.log(`${this.model}: $${(used / 1e6).toFixed(3)} this call, $${(total / 1e6).toFixed(2)} today (budget $${this.dailyBudgetUsd})`);
    }
  }
}

const toMicro = (usd: number) => Math.ceil(usd * 1e6);

async function add(db: D1Database, bucket: string, windowStart: number, amount: number): Promise<number> {
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, ?)
       ON CONFLICT (bucket, window_start) DO UPDATE SET count = count + excluded.count
       RETURNING count`,
    )
    .bind(bucket, windowStart, amount)
    .first<{ count: number }>();
  return row?.count ?? 0;
}
