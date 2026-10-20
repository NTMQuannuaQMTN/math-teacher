"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BudgetBanner, Card, ErrorNote } from "@/components/ui";
import { ApiError, api, DOCUMENT_STATUS_LABELS, type DocumentSummary } from "@/lib/api";

const DOC_STATUS_STYLES: Record<DocumentSummary["status"], string> = {
  uploaded: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-800",
  needs_review: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DocumentSummary[]>("/documents")
      .then(setDocuments)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Không tải được danh sách."));
  }, []);

  return (
    <div className="space-y-6">
      <BudgetBanner />
      <section className="rounded-3xl bg-gradient-to-br from-brand to-indigo-600 p-6 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Ôn thi vào lớp 10 chuyên Toán</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Chụp đề, kiểm tra lại câu hỏi, rồi học từng bước.
        </h1>
        <p className="mt-3 max-w-xl text-blue-100">
          Tải ảnh hoặc tệp PDF đề thi. Hệ thống nhận dạng từng câu và chuyển công thức sang LaTeX để bạn kiểm tra trước khi giải.
        </p>
        <Link
          href="/upload"
          className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand shadow hover:bg-blue-50"
        >
          Tải đề lên
        </Link>
      </section>

      <Card>
        <h2 className="text-lg font-semibold">Tài liệu của bạn</h2>
        <ErrorNote message={error} />
        {documents === null && !error && <p className="mt-3 text-sm text-muted">Đang tải…</p>}
        {documents?.length === 0 && (
          <p className="mt-3 text-sm text-muted">Chưa có tài liệu nào. Hãy tải đề đầu tiên lên.</p>
        )}
        {documents && documents.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link href={`/documents/${doc.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-wash">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{doc.filename}</span>
                    <span className="text-xs text-muted">
                      {new Date(doc.created_at).toLocaleString("vi-VN")} · {doc.page_count ?? "?"} trang ·{" "}
                      {doc.question_count ?? 0} câu
                    </span>
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DOC_STATUS_STYLES[doc.status]}`}>
                    {DOCUMENT_STATUS_LABELS[doc.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
