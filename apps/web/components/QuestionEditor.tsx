"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MathText } from "@/components/MathText";
import { Button, ErrorNote, FlagList, StatusBadge } from "@/components/ui";
import {
  ApiError,
  api,
  jsonBody,
  type LatexCheckOut,
  type QuestionOut,
  type QuestionPatch,
  TOPIC_LABELS,
  type Topic,
} from "@/lib/api";

type Sub = { label: string; latex: string };
const TOPICS = Object.keys(TOPIC_LABELS) as Topic[];

export function QuestionEditor({
  question,
  selected,
  onSelect,
  onChange,
  onDelete,
}: {
  question: QuestionOut;
  selected: boolean;
  onSelect: () => void;
  onChange: (q: QuestionOut) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [latex, setLatex] = useState(question.latex);
  const [subs, setSubs] = useState<Sub[]>(question.subquestions);
  const [number, setNumber] = useState(question.original_number ?? "");
  const [renderErrors, setRenderErrors] = useState<Record<string, string[]>>({});
  const [check, setCheck] = useState<LatexCheckOut | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setLatex(question.latex);
      setSubs(question.subquestions);
      setNumber(question.original_number ?? "");
    }
  }, [question, editing]);

  // Server-side structural check while typing (deterministic, no AI cost).
  useEffect(() => {
    if (!editing) return;
    const combined = [latex, ...subs.map((s) => s.latex)].join("\n");
    const timer = setTimeout(() => {
      api<LatexCheckOut>("/latex/check", jsonBody("POST", { latex: combined }))
        .then(setCheck)
        .catch(() => setCheck(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [latex, subs, editing]);

  const clientErrors = useMemo(() => Object.values(renderErrors).flat(), [renderErrors]);
  const dirty =
    latex !== question.latex ||
    JSON.stringify(subs) !== JSON.stringify(question.subquestions) ||
    number !== (question.original_number ?? "");
  const hasBlockingFlags = question.flags.some((f) => f.severity === "error");

  async function save(patch: Omit<QuestionPatch, "expected_version">): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const updated = await api<QuestionOut>(
        `/questions/${question.id}`,
        jsonBody("PATCH", { expected_version: question.version, ...patch }),
      );
      onChange(updated);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveEdits(confirm: boolean) {
    const ok = await save({
      latex,
      subquestions: subs,
      original_number: number || null,
      ...(confirm ? { review_status: "confirmed" as const } : {}),
    });
    if (ok) setEditing(false);
  }

  async function toggleTopic(topic: Topic) {
    const topics = question.topics.includes(topic)
      ? question.topics.filter((t) => t !== topic)
      : [...question.topics, topic];
    await save({ topics });
  }

  async function remove() {
    if (!window.confirm("Xoá câu hỏi này?")) return;
    try {
      await api<void>(`/questions/${question.id}`, { method: "DELETE" });
      onDelete(question.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xoá được.");
    }
  }

  const title = question.original_number || `Câu ${question.order_index}`;
  const canConfirm = !busy && clientErrors.length === 0 && (editing ? check?.can_confirm !== false : !hasBlockingFlags);

  return (
    <article
      id={`q-${question.id}`}
      aria-labelledby={`q-title-${question.id}`}
      onClick={onSelect}
      className={`rounded-2xl border bg-paper p-4 shadow-sm transition sm:p-5 ${
        selected ? "border-brand ring-2 ring-brand/20" : "border-line"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 id={`q-title-${question.id}`} className="font-semibold">{title}</h3>
          <StatusBadge status={question.review_status} />
          {question.origin === "manual" && <span className="text-xs text-muted">(thêm thủ công)</span>}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Chủ đề">
          {[...question.topics, ...TOPICS.filter((t) => !question.topics.includes(t))].map((topic) => {
            const active = question.topics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                aria-pressed={active}
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation();
                  void toggleTopic(topic);
                }}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  active ? "border-brand bg-brand text-white" : "border-line text-muted hover:border-brand"
                }`}
              >
                {TOPIC_LABELS[topic]}
              </button>
            );
          })}
        </div>
      </header>
      {(question.topics.length > 1 || question.topic_source !== "student") && (
        <p className="mt-1 text-right text-xs text-muted">
          {question.topics.length > 1 && "Bài kết hợp nhiều chủ đề (chủ đề chính đứng đầu). "}
          {question.topic_source !== "student" && "Chủ đề do AI gợi ý — bấm để sửa."}
        </p>
      )}

      {!editing ? (
        <div className="mt-3 space-y-2">
          {question.latex && <MathText text={question.latex} onErrors={(e) => setRenderErrors((r) => ({ ...r, stem: e }))} />}
          {question.subquestions.map((sub, index) => (
            <div key={`${sub.label}-${index}`} className="flex gap-2">
              <span className="font-semibold">{sub.label}</span>
              <MathText text={sub.latex} onErrors={(e) => setRenderErrors((r) => ({ ...r, [`s${index}`]: e }))} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block text-sm">
            <span className="font-medium">Số thứ tự câu</span>
            <input value={number} onChange={(e) => setNumber(e.target.value)} maxLength={64}
              className="mt-1 w-40 rounded-lg border border-line px-2 py-1" />
          </label>
          <LatexField label="Đề bài (LaTeX)" value={latex} onChange={setLatex}
            onErrors={(e) => setRenderErrors((r) => ({ ...r, stem: e }))} />
          {subs.map((sub, index) => (
            <div key={index} className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-center gap-2">
                <input aria-label="Nhãn ý" value={sub.label} maxLength={16}
                  onChange={(e) => setSubs(subs.map((s, i) => (i === index ? { ...s, label: e.target.value } : s)))}
                  className="w-16 rounded-lg border border-line px-2 py-1 text-sm" />
                <Button variant="ghost" onClick={() => {
                  setSubs(subs.filter((_, i) => i !== index));
                  setRenderErrors((r) => ({ ...r, [`s${index}`]: [] }));
                }}>Xoá ý</Button>
              </div>
              <LatexField label={`Ý ${sub.label}`} value={sub.latex}
                onChange={(value) => setSubs(subs.map((s, i) => (i === index ? { ...s, latex: value } : s)))}
                onErrors={(e) => setRenderErrors((r) => ({ ...r, [`s${index}`]: e }))} />
            </div>
          ))}
          <Button variant="secondary" onClick={() => setSubs([...subs, { label: `${String.fromCharCode(97 + subs.length)})`, latex: "" }])}>
            + Thêm ý
          </Button>
          {check && <FlagList flags={check.issues} />}
        </div>
      )}

      {question.assets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {question.assets.map((asset) => (
            // eslint-disable-next-line @next/next/no-img-element -- authenticated image through the gateway
            <img key={asset.id} src={asset.url} alt={`Hình vẽ của ${title}`}
              className="max-h-48 rounded-lg border border-line bg-white" />
          ))}
        </div>
      )}

      {!editing && <div className="mt-3"><FlagList flags={question.flags} /></div>}
      {clientErrors.length > 0 && (
        <div className="mt-2"><FlagList flags={clientErrors.map((m) => ({ code: "katex", severity: "error", message: m }))} /></div>
      )}
      <div className="mt-3"><ErrorNote message={error} /></div>

      <footer className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button onClick={() => void saveEdits(true)} disabled={!canConfirm}>Lưu và xác nhận</Button>
            <Button variant="secondary" onClick={() => void saveEdits(false)} disabled={busy || !dirty}>Chỉ lưu</Button>
            <Button variant="ghost" onClick={() => { setEditing(false); setError(null); }} disabled={busy}>Huỷ</Button>
          </>
        ) : (
          <>
            {question.review_status !== "confirmed" && (
              <Button onClick={() => void save({ review_status: "confirmed" })} disabled={!canConfirm}>
                Xác nhận đúng
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditing(true)}>Sửa</Button>
            {question.review_status === "confirmed" && (
              <Link href={`/questions/${question.id}`} className="inline-flex items-center rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Mở câu hỏi
              </Link>
            )}
            <Button variant="danger" onClick={() => void remove()} className="ml-auto">Xoá</Button>
          </>
        )}
      </footer>
    </article>
  );
}

function LatexField({ label, value, onChange, onErrors }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onErrors: (errors: string[]) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <label className="block text-sm">
        <span className="font-medium">{label}</span>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={Math.min(10, Math.max(3, value.split("\n").length + 1))}
          spellCheck={false} maxLength={20000}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 font-mono text-sm" />
      </label>
      <div className="text-sm">
        <span className="font-medium">Xem trước</span>
        <div className="mt-1 min-h-16 rounded-lg border border-dashed border-line bg-wash px-3 py-2">
          <MathText text={value} onErrors={onErrors} />
        </div>
      </div>
    </div>
  );
}
