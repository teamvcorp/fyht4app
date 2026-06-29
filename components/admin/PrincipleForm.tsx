"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass } from "@/components/admin/Field";
import { savePrinciple, type PrincipleInput } from "@/app/actions/admin";
import { useDraftState } from "@/components/admin/useDraftState";
import type { PrincipleFactor, PrincipleRule } from "@/lib/types";

type FormState = {
  title: string;
  about: string;
  factors: PrincipleFactor[];
  masterySigns: string[];
  notLearnedTells: string[];
  trainingMethods: string[];
  rules: PrincipleRule[];
  bookTitle: string;
  bookAuthor: string;
  bookUrl: string;
  bookProtagonist: string;
};

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
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial: FormState = {
    title: principle.title,
    about: principle.about,
    factors: principle.factors.length ? principle.factors : [],
    masterySigns: principle.masterySigns ?? [],
    notLearnedTells: principle.notLearnedTells ?? [],
    trainingMethods: principle.trainingMethods ?? [],
    rules: principle.rules ?? [],
    bookTitle: principle.book.title ?? "",
    bookAuthor: principle.book.author ?? "",
    bookUrl: principle.book.purchaseUrl ?? "",
    bookProtagonist: principle.book.protagonistNote ?? "",
  };
  const draftKey = `bbp:draft:principle:${principle.step}`;
  const { value: f, set: setF, restored, clearDraft, discard } =
    useDraftState<FormState>(draftKey, initial);

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
      masterySigns: f.masterySigns.map((s) => s.trim()).filter(Boolean),
      notLearnedTells: f.notLearnedTells.map((s) => s.trim()).filter(Boolean),
      trainingMethods: f.trainingMethods.map((s) => s.trim()).filter(Boolean),
      rules: f.rules.filter((r) => r.situation.trim() || r.rule.trim()),
      book: {
        title: f.bookTitle.trim(),
        author: f.bookAuthor.trim() || undefined,
        purchaseUrl: f.bookUrl.trim() || undefined,
        protagonistNote: f.bookProtagonist.trim() || undefined,
      },
    };
    start(async () => {
      setError(null);
      try {
        const r = await savePrinciple(payload);
        if (!r?.ok) {
          setError(r?.error || "Save failed — your edits are still here.");
          return;
        }
        clearDraft();
        setSaved(true);
        router.refresh();
      } catch {
        setError(
          "Couldn't save (your session may have refreshed). Your edits are kept as a draft — reload the page, then save again."
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {restored && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-donow-50 px-3 py-2 text-sm text-donow">
          <span>Restored your unsaved edits.</span>
          <button
            type="button"
            onClick={() => {
              discard();
              router.refresh();
            }}
            className="shrink-0 font-bold underline"
          >
            Discard
          </button>
        </div>
      )}
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

      <ListEditor
        label="Signs it IS mastered"
        placeholder="An observable sign of mastery…"
        items={f.masterySigns}
        onChange={(v) => set("masterySigns", v)}
      />

      <ListEditor
        label="Tells it is NOT yet learned"
        hint="The coach diagnoses from these."
        placeholder="A tell that it's not yet learned…"
        items={f.notLearnedTells}
        onChange={(v) => set("notLearnedTells", v)}
      />

      <ListEditor
        label="Training methods"
        hint="Concrete practices — add as many as you like."
        placeholder="A concrete practice…"
        items={f.trainingMethods}
        onChange={(v) => set("trainingMethods", v)}
      />

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

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3 font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save principle"}
          </button>
          {saved && (
            <span className="text-sm font-semibold text-fyht">Saved ✓</span>
          )}
        </div>
        {error && (
          <p className="rounded-xl bg-donow-50 px-3 py-2 text-sm font-medium text-donow">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function ListEditor({
  label,
  hint,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea
              className={`${inputClass} flex-1 resize-none`}
              rows={2}
              value={item}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              aria-label="Remove"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="px-2 pt-2 text-lg text-ink/40 hover:text-donow"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="self-start rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand active:scale-95"
        >
          + Add
        </button>
      </div>
    </Field>
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
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-2xl bg-brand-50/30 p-2"
          >
            <div className="flex items-center gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={row.a}
                placeholder={aPlaceholder}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...row, a: e.target.value };
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
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={row.b}
              placeholder={bPlaceholder}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, b: e.target.value };
                onChange(next);
              }}
            />
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

