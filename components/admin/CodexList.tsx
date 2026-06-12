"use client";

import { useState } from "react";
import Link from "next/link";

type Item = { id: string; title: string; step: number; triggers: string[] };

export function CodexList({
  items,
  principleTitles,
}: {
  items: Item[];
  principleTitles: Record<number, string>;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.triggers.some((t) => t.toLowerCase().includes(query)) ||
          (principleTitles[i.step] ?? "").toLowerCase().includes(query)
      )
    : items;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search entries…"
          className="flex-1 rounded-2xl bg-brand-50/60 px-4 py-2.5 text-sm outline-none placeholder:text-ink/35 focus:bg-brand-50"
        />
        <Link
          href="/admin/codex/new"
          className="whitespace-nowrap rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-md active:scale-95"
        >
          + New
        </Link>
      </div>

      <p className="text-xs text-ink/45">
        {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
      </p>

      <div className="flex flex-col gap-2">
        {filtered.map((i) => (
          <Link
            key={i.id}
            href={`/admin/codex/${i.id}`}
            className="fyht-card flex items-center justify-between gap-3 p-3.5 transition active:scale-[0.99]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{i.title}</p>
              <p className="truncate text-xs text-ink/45">
                {i.triggers.slice(0, 4).join(" · ") || "no triggers"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase text-brand">
              Rung {i.step}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-ink/45">No entries found.</p>
        )}
      </div>
    </div>
  );
}
