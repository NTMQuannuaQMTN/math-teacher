"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { api, type FlagOut, type QuestionOut, STATUS_LABELS, type UsageOut } from "@/lib/api";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-paper p-5 shadow-sm ${className}`}>{children}</section>;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "border border-line bg-paper text-ink hover:bg-brand-soft disabled:text-muted",
    danger: "border border-red-200 bg-paper text-red-700 hover:bg-red-50",
    ghost: "text-muted hover:bg-brand-soft hover:text-ink",
  }[variant];
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const STATUS_STYLES: Record<QuestionOut["review_status"], string> = {
  pending: "bg-slate-100 text-slate-700",
  flagged: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: { status: QuestionOut["review_status"] }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const FLAG_STYLES: Record<FlagOut["severity"], string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};
const FLAG_ICONS: Record<FlagOut["severity"], string> = { error: "⛔", warning: "⚠️", info: "ℹ️" };

export function FlagList({ flags }: { flags: FlagOut[] }) {
  if (!flags.length) return null;
  return (
    <ul className="space-y-1.5" aria-label="Lưu ý khi kiểm tra">
      {flags.map((flag, index) => (
        <li key={`${flag.code}-${index}`} className={`rounded-lg border px-3 py-1.5 text-sm ${FLAG_STYLES[flag.severity]}`}>
          <span aria-hidden>{FLAG_ICONS[flag.severity]} </span>
          {flag.message}
        </li>
      ))}
    </ul>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

const BUDGET_MESSAGES: Record<UsageOut["budget"]["state"], string | null> = {
  normal: null,
  warning: "Ngân sách AI hôm nay đã dùng hơn 70%. Hệ thống vẫn hoạt động bình thường.",
  restricted: "Hệ thống đang tiết kiệm ngân sách: chỉ còn các tác vụ cơ bản đến hết hôm nay.",
  blocked: "Đã hết ngân sách AI hôm nay. Các tác vụ dùng AI sẽ hoạt động lại vào ngày mai.",
};

export function BudgetBanner() {
  const [usage, setUsage] = useState<UsageOut | null>(null);
  useEffect(() => {
    api<UsageOut>("/usage").then(setUsage).catch(() => setUsage(null));
  }, []);
  const message = usage ? BUDGET_MESSAGES[usage.budget.state] : null;
  if (!message) return null;
  const tone = usage?.budget.state === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800";
  return <p role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${tone}`}>{message}</p>;
}
