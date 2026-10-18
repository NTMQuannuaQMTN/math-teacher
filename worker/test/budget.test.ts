import { describe, expect, it } from "vitest";
import { BudgetedJsonModel } from "../src/solver/budget";
import type { JsonModel } from "../src/solver/llm";

/** Just enough of D1 for the upsert-and-return counter in budget.ts. */
function fakeDb() {
  const rows = new Map<string, number>();
  return {
    rows,
    prepare: (sql: string) => ({
      bind: (bucket: string, start: number, amount: number, _reserve?: number, cap?: number) => ({
        first: async () => {
          const k = `${bucket}@${start}`;
          if(sql.includes('COALESCE(SUM(count),0)')){
            const total=[...rows].filter(([key])=>key.startsWith('spend:')&&key.endsWith('@'+start)).reduce((sum,[,value])=>sum+value,0);
            if(total+amount>(cap??Infinity))return null;
          }
          if(sql.includes("WHERE rate_limits.count") && ((rows.get(k)??0)+amount>(cap??Infinity)))return null;
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

  it("adds usage from classification and all agent turns", async () => {
    const db = fakeDb();
    const agent: JsonModel = {
      name: "agent", model: "gemini-3.8-flash",
      complete: async ({ onUsage }) => {
        onUsage?.({ input: 1000, cachedInput: 100, output: 200, reasoning: 0 });
        onUsage?.({ input: 3000, cachedInput: 200, output: 800, reasoning: 50 });
        return "{}";
      },
    };
    await new BudgetedJsonModel(agent, db, 0.5).complete(input);
    const spent = [...db.rows.values()][0]! / 1e6;
    expect(spent).toBeCloseTo(((4000 - 300) * 0.75 + 300 * 0.075 + 1000 * 3.75) / 1e6, 6);
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
  it("reserves atomically when two calls race for one remaining allowance",async()=>{
    const db=fakeDb(),model=gemini(null),capped=new BudgetedJsonModel(model,db,0.4);
    await Promise.allSettled([capped.complete(input),capped.complete(input)]);
    expect(model.calls).toBe(1);
  });
  it('retains prior model spending when an aggregate-capped provider changes models',async()=>{
    const db=fakeDb(),small={...input,messages:[{role:'user' as const,content:'x'}]};
    const first:JsonModel={name:'first',model:'gemini-3.8-flash',complete:async({onUsage})=>{onUsage?.({input:1,cachedInput:0,output:3000,reasoning:0});return '{}';}};
    const second={...gemini(1000),model:'gemini-3.5-flash'};
    await new BudgetedJsonModel(first,db,.02,undefined,3000,true).complete(small);
    await expect(new BudgetedJsonModel(second,db,.02,undefined,1000,true).complete(small)).rejects.toMatchObject({kind:'quota_exhausted'});
    expect(second.calls).toBe(0);expect(db.rows.size).toBe(1);
    // The next reservation fits its model-specific allowance by itself;
    // blocking it above is specifically caused by the preserved earlier spend.
    await new BudgetedJsonModel(second,fakeDb(),.02,undefined,1000,true).complete(small);expect(second.calls).toBe(1);
  });
  it('counts only spending counters for the same UTC day',async()=>{
    const db=fakeDb(),day=Math.floor(Date.now()/86400000)*86400;
    db.rows.set(`spend:old@${day-86400}`,10000000);db.rows.set(`solve:ip@${day}`,10000000);
    await new BudgetedJsonModel(gemini(100),db,.4,undefined,65536,true).complete(input);
    expect([...db.rows.keys()].some(key=>key.startsWith('spend:gemini'))).toBe(true);
  });
  it('reserves a shared remaining allowance atomically across different model buckets',async()=>{
    const db=fakeDb(),first=gemini(null),second={...gemini(null),model:'gemini-3.5-flash'};
    await Promise.allSettled([new BudgetedJsonModel(first,db,.4,undefined,65536,true).complete(input),new BudgetedJsonModel(second,db,.4,undefined,24000,true).complete(input)]);
    expect(first.calls+second.calls).toBe(1);
  });
});
