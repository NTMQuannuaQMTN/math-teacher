"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BudgetBanner, Button, Card, ErrorNote } from "@/components/ui";
import { ApiError, uploadDocument } from "@/lib/api";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 20 * 1024 * 1024;

export default function UploadPage() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function choose(candidate: File | undefined) {
    setError(null);
    if (!candidate) return;
    if (candidate.size > MAX_BYTES) {
      setError("Tệp quá lớn (tối đa 20 MB).");
      return;
    }
    setFile(candidate);
  }

  async function submit() {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const result = await uploadDocument(file, setProgress);
      router.push(`/documents/${result.document.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tải lên thất bại.");
      setProgress(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BudgetBanner />
      <h1 className="text-2xl font-bold">Tải đề lên</h1>
      <Card>
        <label
          htmlFor="file"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            choose(event.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
            dragging ? "border-brand bg-brand-soft" : "border-line hover:border-brand"
          }`}
        >
          <span aria-hidden className="text-4xl">📄</span>
          <span className="mt-3 font-semibold">Kéo thả tệp vào đây hoặc bấm để chọn</span>
          <span className="mt-1 text-sm text-muted">Ảnh JPG, PNG, WebP hoặc PDF (tối đa 20 trang, 20 MB)</span>
          <span className="mt-1 text-sm text-muted">Hỗ trợ đề in, chữ viết tay và ảnh chụp màn hình công thức.</span>
          <input
            id="file"
            ref={input}
            type="file"
            accept={ACCEPT}
            capture={undefined}
            className="sr-only"
            onChange={(event) => choose(event.target.files?.[0])}
          />
        </label>

        {file && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-wash px-4 py-3 text-sm">
            <span className="min-w-0 truncate">
              <strong>{file.name}</strong> · {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
            <Button variant="ghost" onClick={() => setFile(null)} disabled={progress !== null}>
              Bỏ chọn
            </Button>
          </div>
        )}

        {progress !== null && (
          <div className="mt-4" aria-live="polite">
            <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ tải lên">
              <div className="h-full bg-brand transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {progress < 1 ? `Đang tải lên… ${Math.round(progress * 100)}%` : "Đã tải lên, đang chuyển sang trang kiểm tra…"}
            </p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <ErrorNote message={error} />
          <Button onClick={submit} disabled={!file || progress !== null} className="w-full py-3">
            Nhận dạng đề
          </Button>
        </div>
      </Card>
      <p className="text-sm text-muted">
        Sau khi nhận dạng, bạn sẽ kiểm tra và sửa từng câu trước khi giải. Những chỗ AI không đọc rõ sẽ được tô vàng.
      </p>
    </div>
  );
}
