"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/principles", label: "Principles" },
  { href: "/admin/codex", label: "Codex" },
  { href: "/admin/master", label: "Master" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/test", label: "Test" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-4 flex gap-2">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition active:scale-95 ${
              active
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-ink/60 ring-1 ring-brand/10"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
