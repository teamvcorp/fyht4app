"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { submitBeltTest } from "@/app/actions/taekwondo";
import type { BeltView } from "@/lib/taekwondo";

export function BeltTest({ tier, belt }: { tier: number; belt: BeltView }) {
  const router = useRouter();
  const test = belt.test;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/test-fee", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier, beltIndex: belt.index }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Could not start payment.");
    } catch {
      setError("Network error.");
    }
    setBusy(false);
  }

  async function submit(file: File) {
    setProgress(0);
    setError(null);
    try {
      const r = await upload(
        `belt-tests/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`,
        file,
        {
          access: "private",
          contentType: file.type,
          handleUploadUrl: "/api/upload",
          onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
        }
      );
      const sr = await submitBeltTest(tier, belt.index, r.url, r.pathname);
      setProgress(null);
      if (sr.ok) router.refresh();
      else setError(sr.error ?? "Submission failed.");
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  return (
    <div className="fyht-card overflow-hidden ring-1 ring-gothink/15">
      <div className="h-1.5 w-full bg-gothink" />
      <div className="p-4">
        <p className="text-sm font-bold text-ink">🥋 Belt test: {belt.name}</p>

        {test.status === "passed" ? (
          <p className="mt-2 rounded-xl bg-fyht/10 px-3 py-2 text-sm font-semibold text-fyht">
            Passed ✓ — the next belt is unlocked.
          </p>
        ) : test.status === "submitted" ? (
          <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand">
            Submitted — awaiting the Master&apos;s review.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              You&apos;ve finished every lesson in this belt. Submit a video of
              your form for the Master to review, then unlock the next belt.
            </p>

            {test.status === "failed" && test.reviewerNote && (
              <p className="mt-2 rounded-xl bg-donow-50 px-3 py-2 text-sm text-donow">
                Not passed yet: {test.reviewerNote} — retakes are free.
              </p>
            )}

            {!test.paidAt ? (
              <button
                type="button"
                onClick={pay}
                disabled={busy}
                className="mt-3 w-full rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3 font-bold text-white shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {busy ? "Starting…" : "Pay $20 testing fee"}
              </button>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) submit(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={progress !== null}
                  className="mt-3 w-full rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3 font-bold text-white shadow-md active:scale-[0.99] disabled:opacity-50"
                >
                  {progress !== null
                    ? `Uploading… ${progress}%`
                    : test.status === "failed"
                      ? "Submit a new test video"
                      : "Upload your test video"}
                </button>
              </>
            )}
          </>
        )}

        {error && (
          <p className="mt-2 text-xs font-medium text-donow">{error}</p>
        )}
      </div>
    </div>
  );
}
