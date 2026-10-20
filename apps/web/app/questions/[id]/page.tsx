"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MathText } from "@/components/MathText";
import { Button, Card, ErrorNote, StatusBadge } from "@/components/ui";
import { ApiError, api, type QuestionOut, TOPIC_LABELS } from "@/lib/api";

export default function QuestionWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<QuestionOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api<QuestionOut>(`/questions/${id}`)
      .then(setQuestion)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Không tải được câu hỏi."));
  }, [id]);

  async function solve() {
    setNotice(null);
    try {
      await api(`/questions/${id}/solve`, { method: "POST" });
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Chưa thể giải.");
    }
  }

  if (!question) return error ? <ErrorNote message={error} /> : <p className="text-muted">Đang tải…</p>;
  const title = question.original_number || `Câu ${question.order_index}`;

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
            <span key={t} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">{TOPIC_LABELS[t]}</span>
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
      </Card>

      <Card>
        <h2 className="font-semibold">Giải bài và gợi ý</h2>
        <p className="mt-1 text-sm text-muted">
          Lời giải từng bước, gợi ý và hướng dẫn theo bài làm sẽ có ở các phase tiếp theo. Trạng thái kiểm chứng lời giải
          sẽ hiển thị tại đây.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void solve()} disabled={question.review_status !== "confirmed"}>Giải bài</Button>
          <Button variant="secondary" disabled>Gợi ý</Button>
        </div>
        {question.review_status !== "confirmed" && (
          <p className="mt-2 text-sm text-amber-800">Hãy xác nhận đề bài đúng trước khi giải.</p>
        )}
        {notice && <p role="status" className="mt-3 rounded-lg bg-wash px-3 py-2 text-sm">{notice}</p>}
      </Card>
    </div>
  );
}
