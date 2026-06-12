"use client";

import { useState } from "react";

export function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-brand-50/60 p-2">
      {value.map((v) => (
        <span
          key={v}
          className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ink/80 shadow-sm"
        >
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onChange(value.filter((x) => x !== v))}
            className="text-ink/40 hover:text-donow"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={placeholder ?? "Type and press Enter…"}
        className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-ink/35"
      />
    </div>
  );
}
