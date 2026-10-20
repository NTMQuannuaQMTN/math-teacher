"use client";

// Ensures a guest session exists before rendering pages. When a Turnstile site key is configured the
// visitor completes the Cloudflare challenge first; without one (development) the session is created directly.
import Script from "next/script";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ApiError, ensureSession, hasSession } from "@/lib/api";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type State = "checking" | "challenge" | "ready" | "error";

export function SessionGate({ children, turnstileSiteKey }: { children: ReactNode; turnstileSiteKey: string }) {
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const create = useCallback(async (token: string | null) => {
    try {
      await ensureSession(token);
      setState("ready");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tạo được phiên làm việc.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    hasSession()
      .then((ok) => {
        if (ok) setState("ready");
        else if (turnstileSiteKey) setState("challenge");
        else void create(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Không kết nối được máy chủ.");
        setState("error");
      });
  }, [create, turnstileSiteKey]);

  useEffect(() => {
    if (state !== "challenge" || !scriptLoaded || !widgetRef.current || !window.turnstile) return;
    const id = window.turnstile.render(widgetRef.current, {
      sitekey: turnstileSiteKey,
      language: "vi",
      callback: (token: string) => void create(token),
      "error-callback": () => {
        setError("Không xác minh được. Hãy tải lại trang.");
        setState("error");
      },
    });
    return () => window.turnstile?.remove(id);
  }, [state, scriptLoaded, turnstileSiteKey, create]);

  if (state === "ready") return <>{children}</>;
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-line bg-paper p-8 text-center shadow-sm">
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptLoaded(true)}
        />
      )}
      {state === "checking" && <p className="text-muted">Đang chuẩn bị…</p>}
      {state === "challenge" && (
        <>
          <h1 className="text-lg font-semibold">Xác minh trước khi bắt đầu</h1>
          <p className="mt-2 text-sm text-muted">Bước này giúp chặn truy cập tự động.</p>
          <div ref={widgetRef} className="mt-6 flex justify-center" />
        </>
      )}
      {state === "error" && (
        <div role="alert">
          <p className="font-medium text-red-700">{error}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
