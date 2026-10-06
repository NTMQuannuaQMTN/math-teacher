import { describe, expect, it } from "vitest";
import { BudgetedJsonModel } from "../src/solver/budget";
import type { JsonModel } from "../src/solver/llm";

/** Just enough of D1 for the upsert-and-return counter in budget.ts. */
function fakeDb() {
  const rows = new Map<string, number>();
  return {
    rows,
    prepare: () => ({
      bind: (bucket: string, start: number, amount: number) => ({
        first: async () => {
          const k = `${bucket}@${start}`;
          rows.set(k, (rows.get(k) ?? 0) + amount);
          return { count: rows.get(k)! };
        },
      }),
    }),
  } as unknown as D1Database & { rows: Map<string, number> };
}

const gemini = (output: number | null): JsonModel & { calls: number } => ({
  name: "gemini",
  model: "gemini-3.8-flash",
  calls: 0,
  async complete({ onUsage }) {
    this.calls++;
    if (output === null) throw new Error("truncated");
    onUsage?.({ input: 7000, cachedInput: 0, output, reasoning: 0 });
    return "{}";
  },
});
const input = { messages: [{ role: "user" as const, content: "x".repeat(21_000) }], schema: {}, schemaName: "lesson", signal: new AbortController().signal };

describe("daily budget for the paid fallback", () => {
  it("charges the actual cost of a call that reports usage", async () => {
    const db = fakeDb();
    await new BudgetedJsonModel(gemini(30_000), db, 0.5).complete(input);
    const spent = [...db.rows.values()][0]! / 1e6;
    expect(spent).toBeCloseTo((7000 * 0.75 + 30_000 * 3.75) / 1e6, 4);
  });

  it("keeps the worst case for a call that fails without usage", async () => {
    const db = fakeDb();
    await expect(new BudgetedJsonModel(gemini(null), db, 0.5).complete(input)).rejects.toThrow();
    expect([...db.rows.values()][0]! / 1e6).toBeGreaterThan(0.24);
  });

  it("refuses a call once the budget can't cover the worst case", async () => {
    const db = fakeDb();
    const model = gemini(60_000);
    const capped = new BudgetedJsonModel(model, db, 0.4);
    await capped.complete(input); // ≈ $0.23; the next worst case (≈ $0.25) no longer fits in $0.40
    await expect(capped.complete(input)).rejects.toMatchObject({ kind: "quota_exhausted" });
    expect(model.calls).toBe(1);
  });
});
