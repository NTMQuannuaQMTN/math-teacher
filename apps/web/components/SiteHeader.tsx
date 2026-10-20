import Link from "next/link";

const NAV = [
  { href: "/", label: "Tổng quan" },
  { href: "/upload", label: "Tải đề" },
  { href: "/usage", label: "Sử dụng" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
            ∑
          </span>
          Trợ lý Toán chuyên
        </Link>
        <nav aria-label="Điều hướng chính">
          <ul className="flex gap-1 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-lg px-3 py-2 text-muted hover:bg-brand-soft hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
