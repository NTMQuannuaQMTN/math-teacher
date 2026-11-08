"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QuestionEditor } from "@/components/QuestionEditor";
import { QuestionList } from "@/components/QuestionList";
import { Button, Card, ErrorNote } from "@/components/ui";
import {
  ApiError,
  api,
  type ConfirmAllOut,
  DOCUMENT_STATUS_LABELS,
  type DocumentOut,
  jsonBody,
  type QuestionOut,
} from "@/lib/api";

// Screen 1 ("compare"): every question next to the page image, the first stop after upload. Submitting it confirms
// the questions and moves to screen 2 ("list"), which is home from then on. "Sửa" on a question in the list opens
// screen 1 again for that question only ("edit"); saving or cancelling returns to the list.
type View = { screen: "compare" } | { screen: "list" } | { screen: "edit"; questionId: string };

// Whether screen 1 was submitted, so a reload lands on the list. Per browser only; an all-confirmed document
// always opens on the list.
const submittedKey = (id: string) => `document-submitted:${id}`;
function readSubmitted(id: string): boolean {
  try {
    return window.localStorage.getItem(submittedKey(id)) === "1";
  } catch {
    return false;
  }
}
function writeSubmitted(id: string, submitted: boolean) {
  try {
    if (submitted) window.localStorage.setItem(submittedKey(id), "1");
    else window.localStorage.removeItem(submittedKey(id));
  } catch {
    // Storage unavailable (private window): the screen just isn't remembered across reloads.
  }
}

const questionTitle = (q: QuestionOut) => q.original_number || `Câu ${q.order_index}`;
const firstPageOf = (q: QuestionOut) => q.regions[0]?.page ?? q.source_pages[0];

export default function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [view, setView] = useState<View | null>(null);

  const load = useCallback(async () => {
    try {
      setDoc(await api<DocumentOut>(`/documents/${id}`));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được tài liệu.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (view !== null || !doc || doc.status === "processing") return;
    const allConfirmed = doc.questions.length > 0 && doc.questions.every((q) => q.review_status === "confirmed");
    setView({ screen: allConfirmed || (doc.questions.length > 0 && readSubmitted(id)) ? "list" : "compare" });
  }, [doc, view, id]);

  const processing = doc?.status === "processing";
  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(() => void load(), 2000);
    return () => clearInterval(timer);
  }, [processing, load]);

  function openEditor(question: QuestionOut) {
    setNotice(null);
    setSelected(question.id);
    const firstPage = firstPageOf(question);
    if (firstPage) setPage(firstPage);
    setView({ screen: "edit", questionId: question.id });
    window.scrollTo({ top: 0 });
  }

  function backToList(questionId?: string) {
    setView({ screen: "list" });
    // Wait for the list to render before scrolling back to the question just edited.
    setTimeout(() => {
      const card = questionId && document.getElementById(`item-${questionId}`);
      if (card) card.scrollIntoView({ block: "center" });
      else window.scrollTo({ top: 0 });
    }, 50);
  }

  function replaceQuestion(updated: QuestionOut) {
    setDoc((d) => d && { ...d, questions: d.questions.map((q) => (q.id === updated.id ? updated : q)) });
  }

  function removeQuestion(questionId: string) {
    setDoc((d) => d && { ...d, questions: d.questions.filter((x) => x.id !== questionId) });
    if (view?.screen === "edit") backToList();
  }

  async function reprocess() {
    const edited = doc?.questions.some((q) => q.version > 1 || q.origin === "manual" || q.review_status === "confirmed");
    if (edited && !window.confirm("Nhận dạng lại sẽ xoá các chỉnh sửa của bạn. Tiếp tục?")) return;
    try {
      await api(`/documents/${id}/reprocess`, jsonBody("POST", { discard_edits: Boolean(edited) }));
      // New questions are compared with the image again: back to screen 1 once recognition finishes.
      writeSubmitted(id, false);
      setNotice(null);
      setView(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể nhận dạng lại.");
    }
  }

  // Submits screen 1: confirms every question without errors and moves to the list.
  async function submit() {
    setConfirming(true);
    setNotice(null);
    try {
      const result = await api<ConfirmAllOut>(`/documents/${id}/confirm`, { method: "POST" });
      await load();
      writeSubmitted(id, true);
      if (result.blocked.length > 0) {
        const names = doc?.questions.filter((q) => result.blocked.includes(q.id)).map(questionTitle).join(", ");
        setNotice({
          ok: false,
          text: `Đã xác nhận ${result.confirmed.length} câu. Còn ${result.blocked.length} câu có lỗi cần sửa: ${names}. Bấm “Sửa” ở câu đó để đối chiếu lại với ảnh.`,
        });
      } else if (result.confirmed.length > 0) {
        setNotice({ ok: true, text: `Đã xác nhận ${result.confirmed.length} câu.` });
      }
      backToList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xác nhận được.");
    } finally {
      setConfirming(false);
    }
  }

  async function addQuestion() {
    setAdding(true);
    try {
      const created = await api<QuestionOut>(`/documents/${id}/questions`, jsonBody("POST", { latex: "Nhập đề bài…" }));
      setDoc((d) => d && { ...d, questions: [...d.questions, created] });
      if (view?.screen === "list") {
        openEditor(created);
      } else {
        setSelected(created.id);
        setTimeout(() => document.getElementById(`q-${created.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thêm được câu hỏi.");
    } finally {
      setAdding(false);
    }
  }

  if (!doc) {
    return error ? <ErrorNote message={error} /> : <p className="text-muted">Đang tải…</p>;
  }

  const failedPages = doc.page_results.filter((r) => r.status === "failed");
  const confirmed = doc.questions.filter((q) => q.review_status === "confirmed").length;
  const unconfirmed = doc.questions.length - confirmed;
  const editing = view?.screen === "edit" ? doc.questions.find((q) => q.id === view.questionId) : undefined;
  const screen = view?.screen === "edit" && !editing ? "list" : (view?.screen ?? "compare");
  const imageQuestions = editing ? [editing] : doc.questions;
  const selectedQuestion = editing ?? doc.questions.find((q) => q.id === selected);
  const currentPage = doc.pages.find((p) => p.page_number === page) ?? doc.pages[0];

  const submitButton = (
    <Button onClick={() => void (unconfirmed > 0 ? submit() : (writeSubmitted(id, true), backToList()))} disabled={confirming}>
      {confirming ? "Đang xác nhận…" : unconfirmed > 0 ? `Xác nhận tất cả (${unconfirmed}) và tiếp tục →` : "Tiếp tục →"}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{doc.filename}</h1>
          <p className="text-sm text-muted">
            {doc.status === "needs_review" && doc.questions.length > 0 && unconfirmed === 0
              ? "Đã xác nhận"
              : DOCUMENT_STATUS_LABELS[doc.status]} · {doc.page_count ?? "?"} trang · {doc.questions.length} câu · đã xác nhận{" "}
            {confirmed}/{doc.questions.length}
          </p>
        </div>
        {!processing && screen !== "edit" && (
          <div className="flex flex-wrap gap-2">
            {screen === "compare" && doc.questions.length > 0 && submitButton}
            <Button variant="secondary" onClick={() => void addQuestion()} disabled={adding}>+ Thêm câu bị thiếu</Button>
            <Button variant="secondary" onClick={() => void reprocess()}>Nhận dạng lại</Button>
          </div>
        )}
      </div>

      <ErrorNote message={error} />
      {notice && screen === "list" && (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm ${notice.ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
          {notice.text}
        </p>
      )}

      {processing && (
        <Card>
          <p className="font-medium" aria-live="polite">
            Đang nhận dạng… {doc.job?.progress?.pages_done ?? 0}/{doc.job?.progress?.pages_total ?? doc.page_count ?? "?"} trang
          </p>
          <p className="mt-1 text-sm text-muted">Bạn có thể để trang này mở; kết quả sẽ tự hiện ra.</p>
        </Card>
      )}

      {doc.status === "failed" && (
        <Card className="border-red-200">
          <p className="font-semibold text-red-800">Nhận dạng thất bại</p>
          <p className="mt-1 text-sm text-red-800">{doc.error_message ?? "Đã xảy ra lỗi."}</p>
        </Card>
      )}

      {failedPages.length > 0 && doc.status !== "failed" && screen !== "edit" && (
        <ErrorNote message={`Không nhận dạng được trang ${failedPages.map((p) => p.page).join(", ")}: ${failedPages[0]?.error_message ?? ""} Bạn có thể bấm “Nhận dạng lại” hoặc thêm câu thủ công.`} />
      )}

      {screen === "list" && (
        <section className="space-y-3" aria-label="Kiểm tra và xác nhận">
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              {unconfirmed > 0
                ? `Còn ${unconfirmed} câu chưa xác nhận. Bấm “Sửa” ở câu đó để đối chiếu lại với ảnh.`
                : "Tất cả các câu đã được xác nhận. Bấm vào một câu để mở, hoặc “Sửa” để đối chiếu lại với ảnh."}
            </p>
          </Card>
          <QuestionList questions={doc.questions} onEdit={(qid) => {
            const q = doc.questions.find((x) => x.id === qid);
            if (q) openEditor(q);
          }} />
        </section>
      )}

      {screen === "compare" && doc.questions.length > 0 && (
        <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm">
          Hãy so sánh từng câu với ảnh gốc. Chỗ tô vàng là ký hiệu AI chưa đọc rõ. Khi tất cả đã đúng, bấm “Xác nhận tất
          cả và tiếp tục”. Câu hỏi chỉ được giải sau khi bạn xác nhận.
        </p>
      )}
      {screen === "edit" && editing && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm">
          <p>Đối chiếu <strong>{questionTitle(editing)}</strong> với ảnh gốc rồi lưu. Lưu hoặc huỷ sẽ quay về danh sách.</p>
        </div>
      )}

      {(screen === "compare" || screen === "edit") && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {currentPage && (
            <div className="lg:sticky lg:top-4 lg:self-start">
              <Card className="p-3">
                {doc.pages.length > 1 && (
                  <div className="mb-2 flex flex-wrap gap-1" role="tablist" aria-label="Trang">
                    {doc.pages.map((p) => (
                      <button key={p.page_number} type="button" role="tab" aria-selected={p.page_number === currentPage.page_number}
                        onClick={() => setPage(p.page_number)}
                        className={`rounded-lg px-3 py-1 text-sm ${p.page_number === currentPage.page_number ? "bg-brand text-white" : "hover:bg-brand-soft"}`}>
                        Trang {p.page_number}
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- authenticated image through the gateway */}
                  <img src={currentPage.image_url} alt={`Ảnh gốc trang ${currentPage.page_number}`}
                    width={currentPage.width} height={currentPage.height} className="h-auto w-full rounded-lg border border-line" />
                  {imageQuestions.flatMap((q) =>
                    q.regions
                      .filter((r) => r.page === currentPage.page_number)
                      .map((r, index) => {
                        const [x0, y0, x1, y1] = r.bbox;
                        const active = q.id === selectedQuestion?.id;
                        return (
                          <button key={`${q.id}-${index}`} type="button"
                            aria-label={`Chọn ${q.original_number ?? `câu ${q.order_index}`}`}
                            onClick={() => {
                              setSelected(q.id);
                              document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            className={`absolute rounded border-2 transition ${active ? "border-brand bg-brand/10" : "border-amber-400/70 hover:bg-amber-200/20"}`}
                            style={{ left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` }}
                          />
                        );
                      }),
                  )}
                </div>
                {selectedQuestion && selectedQuestion.regions.length === 0 && (
                  <p className="mt-2 text-xs text-muted">
                    {editing ? "Câu này" : "Câu đang chọn"} chưa có vị trí trên ảnh.
                  </p>
                )}
              </Card>
            </div>
          )}

          <div className="space-y-3">
            {editing ? (
              <QuestionEditor key={`edit-${editing.id}`} question={editing} selected startEditing
                onSelect={() => undefined}
                onChange={replaceQuestion}
                onDone={() => backToList(editing.id)}
                onDelete={removeQuestion}
              />
            ) : (
              doc.questions.map((q) => (
                <QuestionEditor key={q.id} question={q} selected={q.id === selected}
                  onSelect={() => {
                    setSelected(q.id);
                    const firstPage = firstPageOf(q);
                    if (firstPage) setPage(firstPage);
                  }}
                  onChange={replaceQuestion}
                  onDelete={removeQuestion}
                />
              ))
            )}
            {!processing && doc.questions.length === 0 && doc.status !== "failed" && (
              <Card><p className="text-sm text-muted">Không tìm thấy câu hỏi nào. Bạn có thể thêm câu thủ công.</p></Card>
            )}
            {screen === "compare" && doc.questions.length > 0 && !processing && (
              <div className="flex justify-end">{submitButton}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
