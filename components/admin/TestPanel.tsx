"use client";

import { useState, useTransition } from "react";
import { previewCoach, type PreviewResult } from "@/app/actions/admin";
import { inputClass } from "@/components/admin/Field";

export function TestPanel() {
  const [question, setQuestion] = useState("");
  const [rung, setRung] = useState(5);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [pending, start] = useTransition();

  function run() {
    if (!question.trim()) return;
    start(async () => {
      setResult(await previewCoach(question, rung));
    });
  }

  const r = result?.response;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink/45">
        Try a question as a user at a chosen rung — see what The Master diagnoses,
        where it routes, and the answer. Nothing is saved.
      </p>

      <textarea
        className={`${inputClass} resize-none`}
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="My 8-year-old won't take responsibility for anything…"
      />

      <div className="flex items-center gap-3">
        <label className="text-xs font-bold uppercase tracking-wide text-ink/50">
          User at rung
        </label>
        <select
          className={`${inputClass} py-1.5`}
          value={rung}
          onChange={(e) => setRung(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={run}
          disabled={pending || !question.trim()}
          className="ml-auto rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-2.5 font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
        >
          {pending ? "Running…" : "Run"}
        </button>
      </div>

      {r && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand">
              target rung: {r.targetStep ?? "—"}
            </span>
            <span className="rounded-full bg-fyht/10 px-2.5 py-1 text-fyht">
              routed rung: {r.routedStep ?? "—"}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-ink/60 ring-1 ring-brand/10">
              grounded: {String(r.groundedInCodex)}
            </span>
          </div>

          {r.routedReason && (
            <p className="rounded-xl bg-donow-50 px-3 py-2 text-sm text-donow">
              {r.routedReason}
            </p>
          )}

          <div className="text-xs text-ink/50">
            matched entries:{" "}
            {result!.matched.length
              ? result!.matched
                  .map((m) => `${m.title} (rung ${m.step})`)
                  .join(", ")
              : "none"}
          </div>

          <Section label="Do Now" body={r.doNow} />
          <Section label="Do Later" body={r.doLater} />
          <Section label="Go Think" body={r.goThink} />

          {r.recommendedBook && (
            <p className="rounded-xl bg-dolater-50 px-3 py-2 text-sm text-dolater">
              📖 Book → {r.recommendedBook.principleTitle}:{" "}
              <strong>{r.recommendedBook.title || "(no title set)"}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div className="fyht-card p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink/45">
        {label}
      </p>
      <p className="mt-1 text-sm text-ink/85">{body}</p>
    </div>
  );
}
