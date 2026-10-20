"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QuestionEditor } from "@/components/QuestionEditor";
import { Button, Card, ErrorNote } from "@/components/ui";
import { ApiError, api, DOCUMENT_STATUS_LABELS, type DocumentOut, jsonBody, type QuestionOut } from "@/lib/api";

export default function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);

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

  const processing = doc?.status === "processing";
  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(() => void load(), 2000);
    return () => clearInterval(timer);
  }, [processing, load]);

  function replaceQuestion(updated: QuestionOut) {
    setDoc((d) => d && { ...d, questions: d.questions.map((q) => (q.id === updated.id ? updated : q)) });
  }

  async function reprocess() {
    const edited = doc?.questions.some((q) => q.version > 1 || q.origin === "manual" || q.review_status === "confirmed");
    if (edited && !window.confirm("Nhận dạng lại sẽ xoá các chỉnh sửa của bạn. Tiếp tục?")) return;
    try {
      await api(`/documents/${id}/reprocess`, jsonBody("POST", { discard_edits: Boolean(edited) }));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể nhận dạng lại.");
    }
  }

  async function addQuestion() {
    setAdding(true);
    try {
      const created = await api<QuestionOut>(`/documents/${id}/questions`, jsonBody("POST", { latex: "Nhập đề bài…" }));
      setDoc((d) => d && { ...d, questions: [...d.questions, created] });
      setSelected(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thêm được câu hỏi.");
    } finally {
      setAdding(false);
    }
  }

  if (!doc) {
    return error ? <ErrorNote message={error} /> : <p className="text-muted">Đang tải…</p>;
  }

  const currentPage = doc.pages.find((p) => p.page_number === page) ?? doc.pages[0];
  const failedPages = doc.page_results.filter((r) => r.status === "failed");
  const confirmed = doc.questions.filter((q) => q.review_status === "confirmed").length;
  const selectedQuestion = doc.questions.find((q) => q.id === selected);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{doc.filename}</h1>
          <p className="text-sm text-muted">
            {DOCUMENT_STATUS_LABELS[doc.status]} · {doc.page_count ?? "?"} trang · {doc.questions.length} câu · đã xác nhận{" "}
            {confirmed}/{doc.questions.length}
          </p>
        </div>
        {!processing && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void addQuestion()} disabled={adding}>+ Thêm câu bị thiếu</Button>
            <Button variant="secondary" onClick={() => void reprocess()}>Nhận dạng lại</Button>
          </div>
        )}
      </div>

      <ErrorNote message={error} />

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

      {failedPages.length > 0 && doc.status !== "failed" && (
        <ErrorNote message={`Không nhận dạng được trang ${failedPages.map((p) => p.page).join(", ")}: ${failedPages[0]?.error_message ?? ""} Bạn có thể bấm “Nhận dạng lại” hoặc thêm câu thủ công.`} />
      )}

      {doc.questions.length > 0 && (
        <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm">
          Hãy so sánh từng câu với ảnh gốc. Chỗ tô vàng là ký hiệu AI chưa đọc rõ. Câu hỏi chỉ được giải sau khi bạn xác nhận.
        </p>
      )}

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
                {doc.questions.flatMap((q) =>
                  q.regions
                    .filter((r) => r.page === currentPage.page_number)
                    .map((r, index) => {
                      const [x0, y0, x1, y1] = r.bbox;
                      const active = q.id === selected;
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
                <p className="mt-2 text-xs text-muted">Câu đang chọn chưa có vị trí trên ảnh.</p>
              )}
            </Card>
          </div>
        )}

        <div className="space-y-3">
          {doc.questions.map((q) => (
            <QuestionEditor key={q.id} question={q} selected={q.id === selected}
              onSelect={() => {
                setSelected(q.id);
                const firstPage = q.regions[0]?.page ?? q.source_pages[0];
                if (firstPage) setPage(firstPage);
              }}
              onChange={replaceQuestion}
              onDelete={(qid) => setDoc((d) => d && { ...d, questions: d.questions.filter((x) => x.id !== qid) })}
            />
          ))}
          {!processing && doc.questions.length === 0 && doc.status !== "failed" && (
            <Card><p className="text-sm text-muted">Không tìm thấy câu hỏi nào. Bạn có thể thêm câu thủ công.</p></Card>
          )}
        </div>
      </div>
    </div>
  );
}
