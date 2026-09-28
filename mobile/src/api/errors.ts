import type { ErrorCode } from "@shared/contract";
import { getStrings } from "@/i18n";

export type AppErrorKind = "network" | "timeout" | "api" | "invalid_response" | "aborted" | "config";

/** The single error type the UI deals with. */
export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    readonly retryable: boolean,
    readonly code?: ErrorCode,
    readonly status?: number,
  ) {
    super(code ? `${kind}:${code}` : kind);
    this.name = "AppError";
  }
}

export function isAbort(err: unknown): boolean {
  return err instanceof AppError && err.kind === "aborted";
}

/** Localized, student-friendly message for any error. */
export function errorMessage(err: unknown): string {
  const s = getStrings();
  if (!(err instanceof AppError)) return s.errors.unknown;
  switch (err.kind) {
    case "network":
      return s.errors.network;
    case "timeout":
      return s.errors.timeout;
    case "invalid_response":
    case "config":
      return s.errors.invalidResponse;
    case "api":
      return (err.code && s.errorCodes[err.code]) || s.errors.unknown;
    default:
      return s.errors.unknown;
  }
}
