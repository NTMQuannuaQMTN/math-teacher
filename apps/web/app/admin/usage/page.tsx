"use client";

// Cost monitoring for administrators. In production /admin/* is protected by Cloudflare Access and the
// API verifies the forwarded Access JWT; in development the gateway adds ADMIN_DEV_TOKEN.
import { useEffect, useState } from "react";
import { Card, ErrorNote } from "@/components/ui";
import { type AdminUsageOut, ApiError, api, formatSgd } from "@/lib/api";

export default function AdminUsagePage() {
  const [data, setData] = useState<AdminUsageOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminUsageOut>("/admin/usage?days=14")
      .then(setData)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Không tải được dữ liệu."));
  }, []);

  if (!data) return error ? <ErrorNote message={error} /> : <p className="text-muted">Đang tải…</p>;
  const b = data.budget;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Chi phí AI</h1>
        <p className="text-sm text-muted">Quản trị viên: {data.admin_email}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Đã chi hôm nay" value={formatSgd(b.spent_sgd)} />
        <Stat label="Đang giữ chỗ" value={formatSgd(b.reserved_sgd)} />
        <Stat label="Trạng thái" value={b.state} />
        <Stat label="OCR cache (mục / lượt dùng lại)" value={`${data.ocr_cache_entries} / ${data.ocr_cache_hits}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="Theo mô hình (hôm nay)" rows={data.by_model} />
        <Breakdown title="Theo tác vụ (hôm nay)" rows={data.by_purpose} />
      </div>
      <Card>
        <h2 className="font-semibold">14 ngày gần nhất</h2>
        <Table head={["Ngày", "Đã chi", "Giữ chỗ", "Trần"]}
          rows={data.days.map((d) => [d.day, formatSgd(d.spent_sgd), formatSgd(d.reserved_sgd), formatSgd(d.ceiling_sgd)])} />
      </Card>
      <Card>
        <h2 className="font-semibold">50 lượt gọi gần nhất ({data.open_reservations} đang mở)</h2>
        <Table head={["Thời gian", "Tác vụ", "Mô hình", "Trạng thái", "Giữ chỗ", "Thực tế", "Token vào/ra", "ms"]}
          rows={data.recent_calls.map((c) => [
            new Date(c.created_at).toLocaleString("vi-VN"), c.purpose, c.model, `${c.status}${c.outcome ? ` (${c.outcome})` : ""}`,
            formatSgd(c.reserved_sgd), c.actual_sgd === null ? "—" : formatSgd(c.actual_sgd),
            `${c.prompt_tokens ?? "—"}/${c.completion_tokens ?? "—"}`, String(c.latency_ms ?? "—"),
          ])} />
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </Card>
  );
}

function Breakdown({ title, rows }: { title: string; rows: AdminUsageOut["by_model"] }) {
  return (
    <Card>
      <h2 className="font-semibold">{title}</h2>
      <Table head={["Khoá", "Lượt", "Chi phí", "Token vào", "Token ra"]}
        rows={rows.map((r) => [r.key, String(r.calls), formatSgd(r.cost_sgd), String(r.prompt_tokens), String(r.completion_tokens)])} />
    </Card>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  if (!rows.length) return <p className="mt-2 text-sm text-muted">Chưa có dữ liệu.</p>;
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-muted"><tr>{head.map((h) => <th key={h} className="py-1 pr-3 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="py-1.5 pr-3 whitespace-nowrap">{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
