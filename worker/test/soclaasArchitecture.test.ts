import { afterEach, describe, expect, it, vi } from "vitest";
import { createOcrProvider } from "../src/ocr/service";
import type { Env } from "../src/env";
import { GeometryBoard, PROBLEM_TYPES, runTypeTool, toolsFor } from "../src/solver/agentTools";
import { SoclaasAgentModel } from "../src/solver/agent";

afterEach(() => vi.restoreAllMocks());

describe("SocLaas-only specialist architecture", () => {
  it("defaults upload OCR to SocLaas and rejects an old provider without silently using it", () => {
    const base = { ENVIRONMENT: "production", SOCLAAS_API_KEY: "test" } as Env;
    expect(createOcrProvider(base).name).toBe("soclaas");
    // Old provider values are configuration errors rather than an unexpected paid/provider fallback.
    expect(() => createOcrProvider({ ...base, OCR_PROVIDER: "gemini" })).toThrowError(/tạm thời/i);
  });

  it("gives every classified type exactly three specialist tools", () => {
    for (const type of PROBLEM_TYPES) {
      const names = toolsFor(type).map((tool) => tool.function.name);
      expect(names, type).toHaveLength(3);
    }
    expect(toolsFor("algebra").map((t) => t.function.name)).toEqual(["evaluate", "machine_solve", "check_simplification"]);
    expect(toolsFor("number_theory").map((t) => t.function.name)).toEqual(["modulo", "integer_search", "number_facts"]);
    expect(toolsFor("combinatorics").map((t) => t.function.name)).toEqual(["counting_formula", "enumerate_count", "take_away_game"]);
    expect(toolsFor("geometry").map((t) => t.function.name)).toEqual(["figure_from_statement", "build_figure", "check_property"]);
  });

  it("asks SocLaas to classify first, then sends only the selected specialist tools", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{"type":"geometry"}' } }] }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response("busy", { status: 503 }));
    const model = new SoclaasAgentModel("https://soclaas.example/v1", "key", "model", {
      problemText: "Cho tam giác ABC vuông tại A.", withFigure: true, deadline: Date.now() + 20_000, maxTurns: 1,
    });

    await expect(model.complete({ messages: [{ role: "user", content: "solve" }], schema: { type: "object" }, schemaName: "lesson", signal: new AbortController().signal })).rejects.toMatchObject({ kind: "timeout" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const classification = JSON.parse(String(fetchMock.mock.calls[0]![1]!.body)) as { tools?: unknown; response_format?: { json_schema?: { name?: string } } };
    const solve = JSON.parse(String(fetchMock.mock.calls[1]![1]!.body)) as { tools: { function: { name: string } }[] };
    expect(classification.response_format?.json_schema?.name).toBe("problem_type");
    expect(classification.tools).toBeUndefined();
    const names = solve.tools.map((tool) => tool.function.name);
    expect(names).toEqual(expect.arrayContaining(["figure_from_statement", "build_figure", "check_property"]));
    expect(names).not.toContain("machine_solve");
    expect(names).not.toContain("integer_search");
    expect(names).not.toContain("enumerate_count");
  });

  it("builds a geometry figure from point, line, polygon, circle and property lists", () => {
    const board = new GeometryBoard();
    const result = runTypeTool("build_figure", {
      points: [
        { id: "A", kind: "free", refs: [], x: 0, y: 0, value: null, value2: null },
        { id: "B", kind: "free", refs: [], x: 4, y: 0, value: null, value2: null },
        { id: "C", kind: "free", refs: [], x: 0, y: 3, value: null, value2: null },
      ],
      lines: [{ from: "A", to: "B", kind: "line", given: true }],
      polygons: [{ vertices: ["A", "B", "C"], given: true }],
      circles: [{ id: "cA", center: "A", through: "B", radius: null, given: true }],
      properties: [{ kind: "perpendicular", refs: ["A", "B", "A", "C"], value: null, role: "derived" }],
    }, { board, problemText: "" });

    expect(result).toContain("ĐÚNG trên hình");
    expect(board.figure.points.map((p) => p.id)).toEqual(["A", "B", "C"]);
    expect(board.figure.lines.length).toBeGreaterThanOrEqual(4);
    expect(board.figure.circles).toHaveLength(1);
    expect(board.figure.checks).toEqual([expect.objectContaining({ kind: "perpendicular", role: "derived" })]);
  });
});
