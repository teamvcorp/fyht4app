"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/journey", label: "Journey", icon: "🧭" },
  { href: "/account", label: "Account", icon: "⚙️" },
  { href: "/train", label: "Taekwondo", icon: "🥋" },
  { href: "/membership?from=book", label: "Book", icon: "📖" },
];

const SISTER_APPS = [
  { href: "https://spiritofsanta.com", label: "Spirit of Santa" },
  { href: "https://thegooddeed.net", label: "The Good Deed" },
];

export function FooterNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-brand/10 bg-white/85 backdrop-blur-md">
      {/* Family of apps */}
      <div className="mx-auto flex max-w-md items-center justify-center gap-2 border-b border-brand/5 px-2 pt-1.5 text-[11px] text-ink/45">
        <span className="font-semibold uppercase tracking-wide text-ink/35">
          Also from us:
        </span>
        {SISTER_APPS.map((app, i) => (
          <span key={app.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-ink/20">·</span>}
            <a
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand transition active:scale-95"
            >
              {app.label} ↗
            </a>
          </span>
        ))}
      </div>

      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
        {ITEMS.map((item) => {
          const active = pathname === item.href.split("?")[0];
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition active:scale-95 ${
                active ? "text-brand" : "text-ink/55"
              }`}
            >
              <span className="text-xl leading-none" aria-hidden>
                {item.icon}
              </span>
              <span className="text-[11px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
