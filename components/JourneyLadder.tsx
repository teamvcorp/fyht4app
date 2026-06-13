"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setSubjectMastered, setSubjectFactor } from "@/app/actions/subjects";
import { BuyBookButton } from "@/components/BuyBookButton";

export type RungView = {
  step: number;
  title: string;
  about: string;
  factors: string[];
  priceDollars: number;
  enrolled: boolean;
  bookOwned: boolean;
  canMaster: boolean;
  recentCount?: number;
};

export type ProgressView = Record<
  number,
  { mastered: boolean; factors: Record<string, boolean> }
>;

export function JourneyLadder({
  subjectId,
  rungs,
  progress,
  currentStep,
}: {
  subjectId: string;
  rungs: RungView[];
  progress: ProgressView;
  currentStep: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      {rungs.map((rung) => {
        const state =
          rung.step < currentStep
            ? "mastered"
            : rung.step === currentStep
              ? "current"
              : "locked";
        return (
          <RungCard
            key={rung.step}
            subjectId={subjectId}
            rung={rung}
            state={state}
            p={progress[rung.step] ?? { mastered: false, factors: {} }}
          />
        );
      })}
    </div>
  );
}

function RungCard({
  subjectId,
  rung,
  state,
  p,
}: {
  subjectId: string;
  rung: RungView;
  state: "mastered" | "current" | "locked";
  p: { mastered: boolean; factors: Record<string, boolean> };
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const locked = state === "locked";
  const mastered = state === "mastered";

  return (
    <div className={`fyht-card overflow-hidden ${locked ? "opacity-60" : ""}`}>
      <div
        className={`h-1.5 w-full ${
          mastered ? "bg-fyht" : state === "current" ? "bg-brand" : "bg-ink/15"
        }`}
      />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white ${
              mastered ? "bg-fyht" : state === "current" ? "bg-brand" : "bg-ink/30"
            }`}
          >
            {mastered ? "✓" : locked ? "🔒" : rung.step}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              Tier {rung.step}: {rung.title || "Coming soon"}
            </p>
            <p className="truncate text-xs text-ink/45">
              {mastered
                ? "Mastered"
                : state === "current"
                  ? "Current focus"
                  : `Unlock by mastering Tier ${rung.step - 1}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {rung.enrolled && (
              <span className="rounded-full bg-fyht/10 px-2 py-0.5 text-[10px] font-bold uppercase text-fyht">
                Enrolled
              </span>
            )}
            {rung.bookOwned && (
              <span className="rounded-full bg-dolater-50 px-2 py-0.5 text-[10px] font-bold uppercase text-dolater">
                Book ✓
              </span>
            )}
          </div>
        </div>

        {!!rung.recentCount && rung.recentCount > 0 && (
          <p className="mt-2 text-xs font-semibold text-donow">
            Came up {rung.recentCount}× recently
          </p>
        )}

        {!locked && rung.factors.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {rung.factors.map((factor) => (
              <label
                key={factor}
                className="flex items-center gap-2 text-sm text-ink/80"
              >
                <input
                  type="checkbox"
                  checked={!!p.factors[factor]}
                  disabled={pending}
                  onChange={(e) =>
                    start(async () => {
                      await setSubjectFactor(
                        subjectId,
                        rung.step,
                        factor,
                        e.target.checked
                      );
                    })
                  }
                  className="h-4 w-4 accent-brand"
                />
                {factor}
              </label>
            ))}
          </div>
        )}

        {/* Gate: must read the book or complete Taekwondo before verifying mastery */}
        {!locked && !mastered && !rung.canMaster && (
          <div className="mt-3 rounded-2xl bg-brand-50/60 p-3">
            <p className="text-xs leading-relaxed text-ink/70">
              To mark this tier mastered, read its book or complete its Taekwondo.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <BuyBookButton tier={rung.step} />
              <Link
                href={`/train/${rung.step}`}
                className="rounded-xl bg-gradient-to-r from-brand-700 to-brand-600 px-3 py-2 text-xs font-bold text-white active:scale-95"
              >
                🥋 Enroll
              </Link>
            </div>
          </div>
        )}

        {!locked && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={pending || (!mastered && !rung.canMaster)}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const r = await setSubjectMastered(
                    subjectId,
                    rung.step,
                    !mastered
                  );
                  if (!r.ok && r.error) setError(r.error);
                })
              }
              className={`rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-40 ${
                mastered
                  ? "bg-white text-ink/60 ring-1 ring-brand/15"
                  : "bg-fyht text-white"
              }`}
            >
              {mastered ? "Set back to learning" : "Mark mastered"}
            </button>
          </div>
        )}

        {error && <p className="mt-2 text-xs font-medium text-donow">{error}</p>}
      </div>
    </div>
  );
}
