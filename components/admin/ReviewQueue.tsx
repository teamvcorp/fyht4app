"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getSignedVideoUrl,
  reviewBeltTest,
  type BeltSubmission,
} from "@/app/actions/admin";
import { inputClass } from "@/components/admin/Field";

export function ReviewQueue({
  submissions,
}: {
  submissions: BeltSubmission[];
}) {
  if (!submissions.length) {
    return (
      <p className="py-8 text-center text-sm text-ink/45">
        No belt-test submissions waiting for review.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {submissions.map((s) => (
        <ReviewCard key={`${s.userId}-${s.tier}-${s.beltIndex}`} s={s} />
      ))}
    </div>
  );
}

function ReviewCard({ s }: { s: BeltSubmission }) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();

  async function watch() {
    if (!s.submissionPathname) return;
    setLoading(true);
    setUrl(await getSignedVideoUrl(s.submissionPathname));
    setLoading(false);
  }

  function decide(pass: boolean) {
    start(async () => {
      await reviewBeltTest(s.userId, s.tier, s.beltIndex, pass, note);
      router.refresh();
    });
  }

  return (
    <div className="fyht-card p-4">
      <p className="text-sm font-bold text-ink">
        Tier {s.tier} · Belt {s.beltIndex + 1}
      </p>
      <p className="text-xs text-ink/50">
        {s.userName || s.userEmail} · submitted{" "}
        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}
      </p>

      {url ? (
        <video src={url} controls className="mt-3 w-full rounded-xl bg-black" />
      ) : (
        <button
          type="button"
          onClick={watch}
          disabled={loading || !s.submissionPathname}
          className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand active:scale-95 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Watch submission"}
        </button>
      )}

      <textarea
        className={`${inputClass} mt-3 w-full resize-none`}
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note to the student (shown if not passed)…"
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => decide(true)}
          disabled={pending}
          className="flex-1 rounded-xl bg-fyht px-4 py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => decide(false)}
          disabled={pending}
          className="flex-1 rounded-xl border border-donow/30 bg-donow-50 px-4 py-2.5 text-sm font-bold text-donow active:scale-95 disabled:opacity-50"
        >
          Fail
        </button>
      </div>
    </div>
  );
}
