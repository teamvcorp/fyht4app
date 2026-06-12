"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Could not open billing.");
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="flex w-full items-center justify-center rounded-2xl bg-brand-50 px-5 py-3.5 font-bold text-brand transition active:scale-[0.99] disabled:opacity-50"
      >
        {loading ? "Opening…" : "Manage billing"}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm font-medium text-donow">{error}</p>
      )}
    </div>
  );
}
