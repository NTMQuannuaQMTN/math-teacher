import type { Env } from "../types";
import { errorResponse, jsonResponse } from "../utils";
import { getGeometrySpecForQuestion, getQuestion, getSolutionForQuestion } from "../db";
import { toClientQuestion } from "../responses";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function handleGetQuestion(env: Env, id: string): Promise<Response> {
  if (!UUID_RE.test(id)) {
    return errorResponse(400, "Invalid question id.", "bad_request");
  }

  const row = await getQuestion(env, id);
  if (!row) {
    return errorResponse(404, "Question not found.", "not_found");
  }

  const [geometry, solution] = await Promise.all([
    getGeometrySpecForQuestion(env, id),
    getSolutionForQuestion(env, id),
  ]);

  return jsonResponse(toClientQuestion(row, geometry?.spec_json ?? null, solution ?? null));
}
