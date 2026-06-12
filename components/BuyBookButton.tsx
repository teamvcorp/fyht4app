"use client";

import { useState } from "react";

export function BuyBookButton({
  tier,
  className,
}: {
  tier: number;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Could not start checkout.");
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  return (
    <span className="flex flex-col">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className={
          className ??
          "rounded-xl border-2 border-dolater/30 bg-dolater-50 px-3 py-2 text-xs font-bold text-dolater active:scale-95 disabled:opacity-50"
        }
      >
        {loading ? "…" : "📖 Read — $25"}
      </button>
      {error && <span className="mt-1 text-[11px] text-donow">{error}</span>}
    </span>
  );
}
