"use client";

import { useEffect, useState } from "react";
import { Card, ErrorNote } from "@/components/ui";
import { ApiError, api, formatSgd, type UsageOut } from "@/lib/api";

const STATE_LABELS: Record<UsageOut["budget"]["state"], string> = {
  normal: "Bình thường",
  warning: "Cảnh báo",
  restricted: "Tiết kiệm",
  blocked: "Tạm dừng",
};

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<UsageOut>("/usage")
      .then(setUsage)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Không tải được dữ liệu."));
  }, []);

  if (!usage) return error ? <ErrorNote message={error} /> : <p className="text-muted">Đang tải…</p>;
  const { budget, me } = usage;
  const used = Number(budget.spent_sgd) + Number(budget.reserved_sgd);
  const ceiling = Number(budget.ceiling_sgd);
  const percent = Math.min(100, (used / ceiling) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Sử dụng AI hôm nay</h1>
      <Card>
        <h2 className="font-semibold">Của bạn</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-muted">Đã dùng</dt><dd className="text-lg font-semibold">{formatSgd(me.spent_sgd)}</dd></div>
          <div><dt className="text-muted">Hạn mức mỗi ngày</dt><dd className="text-lg font-semibold">{formatSgd(me.daily_cap_sgd)}</dd></div>
          <div><dt className="text-muted">Số lần gọi AI</dt><dd className="text-lg font-semibold">{me.calls}</dd></div>
        </dl>
      </Card>
      <Card>
        <h2 className="font-semibold">Toàn hệ thống · {budget.day}</h2>
        <p className="mt-1 text-sm text-muted">Trạng thái: <strong>{STATE_LABELS[budget.state]}</strong></p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-line" role="meter" aria-valuenow={used} aria-valuemin={0}
          aria-valuemax={ceiling} aria-label="Ngân sách đã dùng">
          <div className={`h-full ${percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">
          {formatSgd(used)} / {formatSgd(ceiling)} (cảnh báo ở {formatSgd(budget.warning_sgd)}, tiết kiệm ở{" "}
          {formatSgd(budget.restricted_sgd)})
        </p>
      </Card>
    </div>
  );
}
