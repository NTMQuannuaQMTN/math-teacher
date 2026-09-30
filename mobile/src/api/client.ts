import { File } from "expo-file-system";
import { Platform } from "react-native";
import {
  ApiErrorBodySchema,
  ConfirmScanRequestSchema,
  IDEMPOTENCY_HEADER,
  ScanListResponseSchema,
  ScanResponseSchema,
  type Scan,
  type ScanListResponse,
  type ScanSource,
  type z,
} from "@shared/contract";
import { SolutionResponseSchema, type Solution } from "@shared/solution";
import { API_URL } from "@/lib/config";
import { getDeviceToken } from "@/lib/deviceToken";
import { AppError } from "./errors";

const DEFAULT_TIMEOUT_MS = 20_000;
/** A positive number from an EXPO_PUBLIC_* variable (inlined at build time), or the fallback. */
const envMs = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
/**
 * Server OCR timeout is 45 s; allow for upload time on slow mobile networks. A local model
 * (development, SOLVER_PROVIDER/OCR_PROVIDER = local) is much slower: raise both via .env.
 */
const OCR_TIMEOUT_MS = envMs(process.env.EXPO_PUBLIC_OCR_TIMEOUT_MS, 90_000);
/** Server solve budget is ~170 s including one corrective retry. */
const SOLVE_TIMEOUT_MS = envMs(process.env.EXPO_PUBLIC_SOLVE_TIMEOUT_MS, 200_000);

interface RequestOptions<S extends z.ZodType | null> {
  method?: "GET" | "POST" | "DELETE";
  body?: BodyInit;
  headers?: Record<string, string>;
  schema: S;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Every API call goes through here: auth header, timeout, cancellation,
 * error mapping, and response validation against the shared contract.
 */
async function request<S extends z.ZodType | null>(
  path: string,
  options: RequestOptions<S>,
): Promise<S extends z.ZodType ? z.infer<S> : void> {
  if (!API_URL) throw new AppError("config", false);
  const token = await getDeviceToken();

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener("abort", onCallerAbort);

  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      method: options.method ?? "GET",
      body: options.body,
      headers: { authorization: `Bearer ${token}`, accept: "application/json", ...options.headers },
      signal: controller.signal,
    });
  } catch (err) {
    if (timedOut) throw new AppError("timeout", true);
    if (options.signal?.aborted) throw new AppError("aborted", false);
    if (__DEV__) console.warn(`[api] ${options.method ?? "GET"} ${API_URL}${path} failed: ${String(err)}`);
    throw new AppError("network", true);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onCallerAbort);
  }

  if (response.status === 204 || options.schema === null) {
    if (!response.ok) throw await toApiError(response);
    return undefined as never;
  }
  if (!response.ok) throw await toApiError(response);

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AppError("invalid_response", true, undefined, response.status);
  }
  const parsed = options.schema.safeParse(json);
  if (!parsed.success) {
    console.warn("API response failed validation", path, parsed.error.issues.slice(0, 3));
    throw new AppError("invalid_response", true, undefined, response.status);
  }
  return parsed.data as never;
}

async function toApiError(response: Response): Promise<AppError> {
  try {
    const parsed = ApiErrorBodySchema.safeParse(await response.json());
    if (parsed.success) {
      return new AppError("api", parsed.data.error.retryable, parsed.data.error.code, response.status);
    }
  } catch {
    // fall through: not a JSON error body (e.g. a proxy error page)
  }
  return new AppError("api", response.status >= 500 || response.status === 429, undefined, response.status);
}

async function imagePart(uri: string): Promise<Blob> {
  if (Platform.OS === "web") {
    return (await fetch(uri)).blob();
  }
  // Expo's fetch (the global fetch since SDK 52+) rejects React Native's classic
  // { uri, name, type } descriptor; it needs a Blob-like part with bytes().
  // expo-file-system's File implements that for a local file URI.
  return new File(uri);
}

export const api = {
  async createScan(input: {
    imageUri: string;
    source: ScanSource;
    idempotencyKey: string;
    signal?: AbortSignal;
  }): Promise<Scan> {
    const form = new FormData();
    form.append("image", await imagePart(input.imageUri), "problem.jpg");
    form.append("source", input.source);
    const { scan } = await request("/v1/scans", {
      method: "POST",
      body: form,
      headers: { [IDEMPOTENCY_HEADER]: input.idempotencyKey },
      schema: ScanResponseSchema,
      timeoutMs: OCR_TIMEOUT_MS,
      signal: input.signal,
    });
    return scan;
  },

  async retryOcr(id: string, signal?: AbortSignal): Promise<Scan> {
    const { scan } = await request(`/v1/scans/${id}/ocr`, {
      method: "POST",
      schema: ScanResponseSchema,
      timeoutMs: OCR_TIMEOUT_MS,
      signal,
    });
    return scan;
  },

  /** Saves one problem (`text`) or the questions kept from a multi-question photo. */
  async confirmScan(id: string, input: { text: string } | { questions: { label: string; text: string }[] }): Promise<Scan> {
    const body = JSON.stringify(ConfirmScanRequestSchema.parse(input));
    const { scan } = await request(`/v1/scans/${id}/confirm`, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      schema: ScanResponseSchema,
    });
    return scan;
  },

  async getScan(id: string, signal?: AbortSignal): Promise<Scan> {
    const { scan } = await request(`/v1/scans/${id}`, { schema: ScanResponseSchema, signal });
    return scan;
  },

  listScans(params: { status: "draft" | "confirmed"; limit?: number; cursor?: string | null }): Promise<ScanListResponse> {
    const query = new URLSearchParams({ status: params.status, limit: String(params.limit ?? 20) });
    if (params.cursor) query.set("cursor", params.cursor);
    return request(`/v1/scans?${query.toString()}`, { schema: ScanListResponseSchema });
  },

  async solve(id: string, options: { questionId?: string; regenerate?: boolean; signal?: AbortSignal } = {}): Promise<Solution> {
    const { solution } = await request(`/v1/scans/${id}/questions/${options.questionId ?? "q1"}/solve`, {
      method: "POST",
      body: JSON.stringify({ regenerate: options.regenerate ?? false }),
      headers: { "content-type": "application/json" },
      schema: SolutionResponseSchema,
      timeoutMs: SOLVE_TIMEOUT_MS,
      signal: options.signal,
    });
    return solution;
  },

  /** Latest stored solution (status "pending" while another request is generating it). */
  async getSolution(id: string, questionId = "q1", signal?: AbortSignal): Promise<Solution> {
    const { solution } = await request(`/v1/scans/${id}/questions/${questionId}/solution`, { schema: SolutionResponseSchema, signal });
    return solution;
  },

  deleteScan(id: string): Promise<void> {
    return request(`/v1/scans/${id}`, { method: "DELETE", schema: null });
  },
};
