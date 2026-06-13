"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass } from "@/components/admin/Field";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { savePrinciple, type PrincipleInput } from "@/app/actions/admin";
import type { Belt, PrincipleFactor, PrincipleRule } from "@/lib/types";

type FormState = {
  title: string;
  about: string;
  factors: PrincipleFactor[];
  masterySignsText: string;
  notLearnedTellsText: string;
  trainingMethodsText: string;
  rules: PrincipleRule[];
  bookTitle: string;
  bookAuthor: string;
  bookUrl: string;
  bookProtagonist: string;
  priceDollars: number;
  belts: Belt[];
};

const lines = (s: string) =>
  s.split("\n").map((x) => x.trim()).filter(Boolean);

export function PrincipleForm({
  principle,
}: {
  principle: {
    step: number;
    title: string;
    about: string;
    factors: PrincipleFactor[];
    masterySigns: string[];
    notLearnedTells: string[];
    trainingMethods: string[];
    rules: PrincipleRule[];
    book: { title: string; author?: string; purchaseUrl?: string; protagonistNote?: string };
    tier: { priceCents: number; belts: Belt[] };
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState<FormState>({
    title: principle.title,
    about: principle.about,
    factors: principle.factors.length ? principle.factors : [],
    masterySignsText: principle.masterySigns.join("\n"),
    notLearnedTellsText: principle.notLearnedTells.join("\n"),
    trainingMethodsText: principle.trainingMethods.join("\n"),
    rules: principle.rules ?? [],
    bookTitle: principle.book.title ?? "",
    bookAuthor: principle.book.author ?? "",
    bookUrl: principle.book.purchaseUrl ?? "",
    bookProtagonist: principle.book.protagonistNote ?? "",
    priceDollars: Math.round((principle.tier.priceCents ?? 0) / 100),
    belts: principle.tier.belts ?? [],
  });

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((s) => ({ ...s, [k]: v }));
    setSaved(false);
  }

  function submit() {
    const payload: PrincipleInput = {
      step: principle.step,
      title: f.title.trim(),
      about: f.about.trim(),
      factors: f.factors.filter((x) => x.name.trim() || x.description.trim()),
      masterySigns: lines(f.masterySignsText),
      notLearnedTells: lines(f.notLearnedTellsText),
      trainingMethods: lines(f.trainingMethodsText),
      rules: f.rules.filter((r) => r.situation.trim() || r.rule.trim()),
      book: {
        title: f.bookTitle.trim(),
        author: f.bookAuthor.trim() || undefined,
        purchaseUrl: f.bookUrl.trim() || undefined,
        protagonistNote: f.bookProtagonist.trim() || undefined,
      },
      tier: {
        priceCents: Math.round((Number(f.priceDollars) || 0) * 100),
        belts: f.belts,
      },
    };
    start(async () => {
      await savePrinciple(payload);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-start">
        {/* Left — the principle's definition */}
        <div className="flex flex-1 flex-col gap-4">
      <Field label="Principle title">
        <input
          className={inputClass}
          value={f.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Self-Control"
        />
      </Field>

      <Field label="About" hint="What this principle is really about.">
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={f.about}
          onChange={(e) => set("about", e.target.value)}
        />
      </Field>

      {/* Factors */}
      <PairEditor
        label="Factors"
        hint="The sub-skills/forces that make up this principle."
        aPlaceholder="Emotions"
        bPlaceholder="Should guide, not dictate"
        rows={f.factors.map((x) => ({ a: x.name, b: x.description }))}
        onChange={(rows) =>
          set(
            "factors",
            rows.map((r) => ({ name: r.a, description: r.b }))
          )
        }
      />

      <Field label="Signs it IS mastered" hint="One per line.">
        <textarea
          className={`${inputClass} resize-none`}
          rows={4}
          value={f.masterySignsText}
          onChange={(e) => set("masterySignsText", e.target.value)}
        />
      </Field>

      <Field label="Tells it is NOT yet learned" hint="One per line — the coach diagnoses from these.">
        <textarea
          className={`${inputClass} resize-none`}
          rows={4}
          value={f.notLearnedTellsText}
          onChange={(e) => set("notLearnedTellsText", e.target.value)}
        />
      </Field>

      <Field label="Training methods" hint="One per line — concrete practices.">
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={f.trainingMethodsText}
          onChange={(e) => set("trainingMethodsText", e.target.value)}
        />
      </Field>

      {/* Situational rules */}
      <PairEditor
        label="Situational rules"
        hint="How the coach applies this principle in specific situations."
        aPlaceholder="child melts down in public"
        bPlaceholder="remove the audience first, then name the feeling"
        rows={f.rules.map((x) => ({ a: x.situation, b: x.rule }))}
        onChange={(rows) =>
          set(
            "rules",
            rows.map((r) => ({ situation: r.a, rule: r.b }))
          )
        }
      />
        </div>

        {/* Right — the Taekwondo program */}
        <div className="flex flex-1 flex-col gap-4">
      {/* Book */}
      <div className="fyht-card flex flex-col gap-3 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/50">
          Book (Step {principle.step} journey)
        </p>
        <input
          className={inputClass}
          value={f.bookTitle}
          onChange={(e) => set("bookTitle", e.target.value)}
          placeholder="Book title"
        />
        <input
          className={inputClass}
          value={f.bookAuthor}
          onChange={(e) => set("bookAuthor", e.target.value)}
          placeholder="Author"
        />
        <input
          className={inputClass}
          value={f.bookUrl}
          onChange={(e) => set("bookUrl", e.target.value)}
          placeholder="Purchase URL"
        />
        <input
          className={inputClass}
          value={f.bookProtagonist}
          onChange={(e) => set("bookProtagonist", e.target.value)}
          placeholder="Protagonist note (age-matched journey)"
        />
      </div>

      {/* Tier */}
      <Field label="Tier price (USD)">
        <input
          type="number"
          className={inputClass}
          value={f.priceDollars}
          onChange={(e) => set("priceDollars", Number(e.target.value))}
        />
      </Field>

      <BeltsEditor belts={f.belts} onChange={(b) => set("belts", b)} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3 font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save principle"}
        </button>
        {saved && <span className="text-sm font-semibold text-fyht">Saved ✓</span>}
      </div>
    </div>
  );
}

function PairEditor({
  label,
  hint,
  aPlaceholder,
  bPlaceholder,
  rows,
  onChange,
}: {
  label: string;
  hint?: string;
  aPlaceholder: string;
  bPlaceholder: string;
  rows: { a: string; b: string }[];
  onChange: (rows: { a: string; b: string }[]) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={`${inputClass} w-2/5`}
              value={row.a}
              placeholder={aPlaceholder}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, a: e.target.value };
                onChange(next);
              }}
            />
            <input
              className={`${inputClass} flex-1`}
              value={row.b}
              placeholder={bPlaceholder}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, b: e.target.value };
                onChange(next);
              }}
            />
            <button
              type="button"
              aria-label="Remove"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              className="px-2 text-lg text-ink/40 hover:text-donow"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...rows, { a: "", b: "" }])}
          className="self-start rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand active:scale-95"
        >
          + Add
        </button>
      </div>
    </Field>
  );
}

function BeltsEditor({
  belts,
  onChange,
}: {
  belts: Belt[];
  onChange: (b: Belt[]) => void;
}) {
  return (
    <Field label="Belts & lessons">
      <div className="flex flex-col gap-3">
        {belts.map((belt, bi) => (
          <div key={bi} className="fyht-card flex flex-col gap-2 p-3">
            <div className="flex gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={belt.name}
                placeholder="Belt name"
                onChange={(e) => {
                  const next = [...belts];
                  next[bi] = { ...belt, name: e.target.value };
                  onChange(next);
                }}
              />
              <button
                type="button"
                aria-label="Remove belt"
                onClick={() => onChange(belts.filter((_, j) => j !== bi))}
                className="px-2 text-lg text-ink/40 hover:text-donow"
              >
                ×
              </button>
            </div>
            {belt.lessons.map((lesson, li) => {
              const patchLesson = (patch: Partial<(typeof belt.lessons)[number]>) => {
                const next = [...belts];
                const lessons = [...belt.lessons];
                lessons[li] = { ...lesson, ...patch };
                next[bi] = { ...belt, lessons };
                onChange(next);
              };
              return (
                <div
                  key={li}
                  className="ml-3 flex flex-col gap-2 rounded-2xl bg-brand-50/40 p-2"
                >
                  <div className="flex gap-2">
                    <input
                      className={`${inputClass} w-2/5`}
                      value={lesson.name}
                      placeholder="Lesson name"
                      onChange={(e) => patchLesson({ name: e.target.value })}
                    />
                    <input
                      className={`${inputClass} flex-1`}
                      value={lesson.focus ?? ""}
                      placeholder="Focus (short)"
                      onChange={(e) => patchLesson({ focus: e.target.value })}
                    />
                  </div>
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={3}
                    value={lesson.instruction ?? ""}
                    placeholder="Written instruction (the text section)…"
                    onChange={(e) => patchLesson({ instruction: e.target.value })}
                  />
                  <VideoUpload
                    value={{
                      videoUrl: lesson.videoUrl,
                      videoPathname: lesson.videoPathname,
                    }}
                    onChange={(v) => patchLesson(v)}
                  />
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                const next = [...belts];
                next[bi] = {
                  ...belt,
                  lessons: [...belt.lessons, { name: "", focus: "" }],
                };
                onChange(next);
              }}
              className="ml-3 self-start text-xs font-bold text-brand"
            >
              + lesson
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([...belts, { name: "", lessons: [{ name: "", focus: "" }] }])
          }
          className="self-start rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand active:scale-95"
        >
          + Add belt
        </button>
      </div>
    </Field>
  );
}
