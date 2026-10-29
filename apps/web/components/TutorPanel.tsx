"use client";

import { useEffect, useRef, useState } from "react";
import { MathInput } from "@/components/MathInput";
import { MathText } from "@/components/MathText";
import { Button, Card, ErrorNote } from "@/components/ui";
import { ApiError, api, jsonBody, type Schemas } from "@/lib/api";
import { acceptUnclear, countUnclear } from "@/lib/math-insert";

type Session = Schemas["TutoringSessionOut"];
type Feedback = NonNullable<Session["messages"][number]["feedback"]>;
type WorkPhoto = Schemas["WorkPhotoOut"];

const STEP_ICON = { correct: "✓", incorrect: "✗", unclear: "?" } as const;
const STEP_STYLE = {
  correct: "border-emerald-200 bg-emerald-50",
  incorrect: "border-red-200 bg-red-50",
  unclear: "border-slate-200 bg-slate-50",
} as const;

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted"><MathText text={feedback.approach_vi} /></p>
      <ol className="space-y-2">
        {feedback.steps.map((step, i) => (
          <li key={i} className={`rounded-lg border px-3 py-2 ${STEP_STYLE[step.status]}`}>
            <div className="flex gap-2">
              <span aria-label={step.status} className="font-semibold">{STEP_ICON[step.status]}</span>
              <MathText text={step.text} className="min-w-0 flex-1" />
            </div>
            {step.note_vi && <MathText text={step.note_vi} className="mt-1 text-sm text-muted" />}
          </li>
        ))}
      </ol>
      {feedback.error_explanation_vi && (
        <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
            Lỗi đầu tiên{feedback.first_error_index !== null ? ` (bước ${feedback.first_error_index + 1})` : ""}
          </p>
          <MathText text={feedback.error_explanation_vi} className="mt-1" />
        </div>
      )}
      <div className="rounded-lg bg-brand-soft px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          {feedback.student_reached_answer ? "Nhận xét" : "Gợi ý cho bước tiếp theo"}
        </p>
        <MathText text={feedback.next_hint_vi} className="mt-1" />
      </div>
      <p className="text-sm">{feedback.encouragement_vi}</p>
      {feedback.tool_checked_steps > 0 && (
        <p className="text-xs text-muted">{feedback.tool_checked_steps} bước biến đổi đã được kiểm tra bằng công cụ toán học.</p>
      )}
    </div>
  );
}

/** "Tự làm bài": the student writes their work; the tutor checks each step and gives one targeted hint. */
export function TutorPanel({ questionId, onSolutionChange }: {
  questionId: string;
  onSolutionChange?: (s: Session["solution"]) => void;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [work, setWork] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [photo, setPhoto] = useState<{ url: string | null; name: string; pages: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const unclear = countUnclear(work);

  // The photo preview is a local object URL (the image is never stored on the server); free it when replaced.
  useEffect(() => () => { if (photo?.url) URL.revokeObjectURL(photo.url); }, [photo]);

  useEffect(() => {
    api<Session>("/sessions", jsonBody("POST", { question_id: questionId }))
      .then(setSession)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Không mở được buổi luyện tập."));
  }, [questionId]);

  async function submit() {
    if (!session || !work.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Session>(`/sessions/${session.id}/messages`, jsonBody("POST", { content: work }));
      setSession(updated);
      onSolutionChange?.(updated.solution);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không gửi được bài làm.");
    } finally {
      setBusy(false);
    }
  }

  /** A photo or scan of the notebook is read into the work box; the student checks it before sending. */
  async function readPhoto(file: File) {
    if (!session) return;
    setReading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const result = await api<WorkPhoto>(`/sessions/${session.id}/work-photo`, { method: "POST", body: form });
      setWork((current) => (current.trim() ? `${current.trimEnd()}\n${result.text}` : result.text));
      setPhoto({ url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null, name: file.name,
                 pages: result.pages });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không đọc được ảnh bài làm.");
    } finally {
      setReading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const turns = session?.messages ?? [];
  return (
    <Card>
      <h2 className="text-lg font-semibold">Tự làm bài</h2>
      <p className="mt-1 text-sm text-muted">
        Viết bài làm của em (có thể dùng LaTeX trong $...$). Thầy/cô AI sẽ kiểm tra từng bước, chỉ ra lỗi đầu tiên và
        gợi ý bước tiếp theo — không đưa ra đáp án.
      </p>

      {turns.length > 0 && (
        <ol className="mt-4 space-y-4" aria-label="Các lượt trao đổi">
          {turns.map((m) => (
            <li key={m.id} className={m.role === "student" ? "rounded-xl border border-line bg-wash px-4 py-3" : ""}>
              {m.role === "student" ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Bài làm của em</p>
                  <MathText text={m.content} className="mt-1" />
                </>
              ) : m.feedback ? <FeedbackCard feedback={m.feedback} /> : <MathText text={m.content} />}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-line px-3 py-2 text-sm">
        <span className="text-muted">Làm trên vở? Chụp ảnh hoặc quét trang vở, hệ thống sẽ chép lại để em kiểm tra.</span>
        <label className={`inline-flex cursor-pointer items-center rounded-lg border border-line bg-paper px-3.5 py-2 font-semibold hover:bg-brand-soft ${reading || !session ? "pointer-events-none opacity-60" : ""}`}>
          {reading ? "Đang đọc bài làm…" : "Tải ảnh bài làm"}
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only"
            disabled={reading || !session} onChange={(e) => { const f = e.target.files?.[0]; if (f) void readPhoto(f); }} />
        </label>
      </div>
      {photo && (
        <details open className="mt-3 rounded-lg border border-line px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium">
            Ảnh bài làm ({photo.pages} trang đã chép): so với phần chép bên dưới và sửa nếu sai
          </summary>
          {photo.url
            // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview, not an optimisable asset
            ? <img src={photo.url} alt="Ảnh bài làm em vừa tải lên" className="mt-2 max-h-96 w-auto rounded border border-line" />
            : <p className="mt-1 text-muted">{photo.name}</p>}
        </details>
      )}

      <MathInput label={turns.length ? "Bài làm tiếp theo" : "Bài làm"} value={work} onChange={setWork} maxLength={4000}
        placeholder="Ví dụ: Ta có $x^2 - 5x + 6 = (x-2)(x-3)$ …" />
      {unclear > 0 && (
        <div role="status" className="mt-2 flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span>Còn {unclear} chỗ chép chưa chắc (tô vàng). Em sửa lại cho đúng với bài làm, hoặc xác nhận nếu đã đúng.</span>
          <Button variant="secondary" onClick={() => setWork(acceptUnclear(work))}>Các chỗ tô vàng đã đúng</Button>
        </div>
      )}
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={() => void submit()} disabled={busy || reading || !work.trim() || !session || unclear > 0}>
          {busy ? "Đang kiểm tra…" : "Gửi bài làm"}
        </Button>
      </div>
      <div className="mt-3"><ErrorNote message={error} /></div>
    </Card>
  );
}
