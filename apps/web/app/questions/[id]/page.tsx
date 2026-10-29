"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MathText } from "@/components/MathText";
import { GeometryPanel } from "@/components/GeometryPanel";
import { HintPanel } from "@/components/HintPanel";
import { SolutionView } from "@/components/SolutionView";
import { TutorPanel } from "@/components/TutorPanel";
import { Button, Card, ErrorNote, StatusBadge } from "@/components/ui";
import {
  ApiError,
  api,
  jsonBody,
  type QuestionOut,
  type SolutionOut,
  type SolveRequestOut,
  TOPIC_LABELS,
} from "@/lib/api";

const POLL_MS = 2500;

export default function QuestionWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<QuestionOut | null>(null);
  const [solution, setSolution] = useState<SolutionOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const loadSolution = useCallback(async () => {
    try {
      setSolution(await api<SolutionOut>(`/questions/${id}/solution`));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        setNotice(err instanceof ApiError ? err.message : "Không tải được lời giải.");
      }
    }
  }, [id]);

  useEffect(() => {
    api<QuestionOut>(`/questions/${id}`)
      .then(setQuestion)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Không tải được câu hỏi."));
    void loadSolution();
  }, [id, loadSolution]);

  const working = solution?.status === "queued" || solution?.status === "running";
  useEffect(() => {
    if (!working) return;
    const poll = setInterval(() => void loadSolution(), POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [working, loadSolution]);

  async function solve(force: boolean) {
    setNotice(null);
    setBusy(true);
    try {
      const result = await api<SolveRequestOut>(`/questions/${id}/solve`, jsonBody("POST", { force }));
      setSolution(result.solution);
      setStartedAt(Date.now());
      if (result.cached) setNotice("Đã có lời giải sẵn cho đề bài giống hệt, được dùng lại ngay.");
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Chưa thể giải.");
    } finally {
      setBusy(false);
    }
  }

  async function act(path: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setNotice(null);
    setBusy(true);
    try {
      setSolution(await api<SolutionOut>(`/questions/${id}/${path}`, { method: "POST" }));
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Không thực hiện được.");
    } finally {
      setBusy(false);
    }
  }

  if (!question) return error ? <ErrorNote message={error} /> : <p className="text-muted">Đang tải…</p>;
  const title = question.original_number || `Câu ${question.order_index}`;
  const confirmed = question.review_status === "confirmed";
  const elapsed = startedAt ? Math.round((now - startedAt) / 1000) : null;

  return (
    <div className="space-y-4">
      <Link href={`/documents/${question.document_id}`} className="text-sm text-brand hover:underline">
        ← Quay lại danh sách câu hỏi
      </Link>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">{title}</h1>
          <StatusBadge status={question.review_status} />
          {question.topics.map((t) => (
            <span key={t} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">
              {TOPIC_LABELS[t]}
            </span>
          ))}
        </div>
        <div className="mt-4 space-y-2 text-lg">
          <MathText text={question.latex} />
          {question.subquestions.map((sub, index) => (
            <div key={index} className="flex gap-2">
              <span className="font-semibold">{sub.label}</span>
              <MathText text={sub.latex} />
            </div>
          ))}
        </div>
        {question.assets.map((asset) => (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated image through the gateway
          <img key={asset.id} src={asset.url} alt={`Hình vẽ của ${title}`} className="mt-4 max-h-72 rounded-lg border border-line" />
        ))}
        <div className="mt-5 flex flex-wrap gap-2">
          {!solution || solution.status === "failed" ? (
            <Button onClick={() => void solve(false)} disabled={!confirmed || busy}>Giải bài</Button>
          ) : (
            <Button variant="secondary" onClick={() => void solve(true)} disabled={!confirmed || busy || working}>
              Giải lại
            </Button>
          )}
        </div>
        {!confirmed && <p className="mt-2 text-sm text-amber-800">Hãy xác nhận đề bài đúng trước khi giải.</p>}
        {notice && <p role="status" className="mt-3 rounded-lg bg-wash px-3 py-2 text-sm">{notice}</p>}
      </Card>

      {question.topics.includes("geometry") && (
        <GeometryPanel key={solution?.figure_id ?? "none"} questionId={question.id} canRequest={confirmed} />
      )}

      {working && (
        <Card>
          <p className="font-medium" aria-live="polite">
            Đang giải{elapsed !== null ? `… ${elapsed} giây` : "…"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Hệ thống giải, rồi kiểm tra đáp số bằng công cụ toán học và kiểm tra phương pháp theo chương trình lớp 9.
            Bài khó có thể mất vài phút.
          </p>
        </Card>
      )}

      {solution?.status === "failed" && (
        <Card className="border-red-200">
          <p className="font-semibold text-red-800">Chưa giải được</p>
          <p className="mt-1 text-sm text-red-800">{solution.error_message ?? "Đã xảy ra lỗi."}</p>
        </Card>
      )}

      {solution?.status === "done" && !solution.solution_revealed && (
        <HintPanel solution={solution} busy={busy} onNextHint={() => void act("hints/next")}
          onReveal={() => void act("solution/reveal",
            solution.hints.length < solution.hints_total
              ? "Em vẫn còn gợi ý chưa xem. Xem lời giải đầy đủ ngay?"
              : undefined)} />
      )}
      {solution?.status === "done" && solution.solved && !solution.solution_revealed && (
        <TutorPanel questionId={question.id} onSolutionChange={(s) => setSolution(s)} />
      )}
      {solution?.status === "done" && solution.solution_revealed && (
        <>
          {solution.hints.length > 0 && (
            <details className="rounded-2xl border border-line bg-paper p-4">
              <summary className="cursor-pointer text-sm font-semibold">Các gợi ý đã xem ({solution.hints.length})</summary>
              <ol className="mt-3 space-y-2">
                {solution.hints.map((hint, index) => (
                  <li key={index}><MathText text={hint.text_vi} /></li>
                ))}
              </ol>
            </details>
          )}
          <SolutionView solution={solution} />
        </>
      )}
    </div>
  );
}
