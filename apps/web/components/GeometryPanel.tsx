"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { ApiError, api, jsonBody, type FigureOut } from "@/lib/api";
import type { GeometrySpec } from "@/lib/geometry/engine";

const GeometryBoard = dynamic(() => import("@/components/GeometryBoard").then((m) => m.GeometryBoard), {
  ssr: false,
  loading: () => <p className="text-sm text-muted">Đang tải hình vẽ…</p>,
});

const STATUS_MESSAGES: Record<Exclude<FigureOut["status"], "ok" | "pending">, string> = {
  infeasible: "Không dựng được hình thỏa mãn mọi điều kiện của đề bài. Hãy kiểm tra lại đề.",
  invalid: "Hình vẽ tự động không hợp lệ.",
  unsupported: "Đề bài có cấu hình mà hệ thống chưa vẽ được.",
  failed: "Không vẽ được hình lúc này.",
};

/** Interactive figure for a geometry question: drawn from the validated construction, not a picture. */
export function GeometryPanel({ questionId, canRequest }: { questionId: string; canRequest: boolean }) {
  const [figure, setFigure] = useState<FigureOut | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setFigure(await api<FigureOut>(`/questions/${questionId}/figure`));
      setMissing(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setMissing(true);
      else setError(err instanceof ApiError ? err.message : "Không tải được hình vẽ.");
    }
  }, [questionId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (figure?.status !== "pending") return;
    const timer = setInterval(() => void load(), 2000);
    return () => clearInterval(timer);
  }, [figure?.status, load]);

  /** `force` draws again from a fresh reading of the problem ("Vẽ lại hình"). */
  async function draw(force = false) {
    setError(null);
    try {
      setFigure(await api<FigureOut>(`/questions/${questionId}/figure`, jsonBody("POST", { force })));
      setMissing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không vẽ được hình.");
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Hình vẽ</h2>
      {missing && (
        <div className="mt-2">
          <p className="text-sm text-muted">Hệ thống dựng hình từ đề bài, rồi em có thể kéo các điểm để khám phá.</p>
          <Button className="mt-3" onClick={() => void draw()} disabled={!canRequest}>Vẽ hình</Button>
        </div>
      )}
      {figure?.status === "pending" && <p className="mt-2 text-sm" aria-live="polite">Đang dựng hình…</p>}
      {figure?.status === "ok" && figure.spec && (
        <div className="mt-3">
          {figure.stale && (
            <p className="mb-2 text-sm text-amber-800">Đề bài đã sửa sau khi vẽ hình. Bấm “Vẽ lại hình” để vẽ theo đề mới.</p>
          )}
          <GeometryBoard spec={figure.spec as unknown as GeometrySpec} initial={figure.initial ?? {}} />
        </div>
      )}
      {figure && figure.status !== "ok" && figure.status !== "pending" && (
        <p className="mt-2 text-sm text-amber-900">{figure.detail ?? STATUS_MESSAGES[figure.status]}</p>
      )}
      {figure && figure.status !== "pending" && (
        <Button variant="secondary" className="mt-3" onClick={() => void draw(true)} disabled={!canRequest}>
          Vẽ lại hình
        </Button>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </Card>
  );
}
