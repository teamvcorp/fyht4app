"use client";

import { useState } from "react";

export function UpgradeButton({ label = "Become a member" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Could not start checkout. Try again.");
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
      >
        {loading ? "Redirecting to checkout…" : label}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm font-medium text-donow">{error}</p>
      )}
    </div>
  );
}
