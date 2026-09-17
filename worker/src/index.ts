import type { Env } from "./types";
import { errorResponse, jsonResponse } from "./utils";
import { handleSubmitQuestion } from "./routes/submitQuestion";
import { handleGetQuestion } from "./routes/getQuestion";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/health") {
        return jsonResponse({ ok: true });
      }

      if (url.pathname === "/api/questions" && request.method === "POST") {
        return await handleSubmitQuestion(request, env);
      }

      const questionMatch = url.pathname.match(/^\/api\/questions\/([^/]+)$/);
      if (questionMatch && request.method === "GET") {
        return await handleGetQuestion(env, questionMatch[1]!);
      }

      return errorResponse(404, "Not found.", "not_found");
    } catch (err) {
      console.error("Unhandled error", err);
      return errorResponse(500, "Internal server error.", "internal_error");
    }
  },
} satisfies ExportedHandler<Env>;
