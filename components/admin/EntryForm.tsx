"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChipInput } from "@/components/ChipInput";
import { Field, inputClass } from "@/components/admin/Field";
import { saveEntry, deleteEntry, type EntryInput } from "@/app/actions/admin";

const EMPTY: EntryInput = {
  title: "",
  step: 1,
  principle: "",
  ageMin: 2,
  ageMax: 7,
  triggers: [],
  topics: [],
  references: [],
  guidance: "",
  deepInsight: "",
};

export function EntryForm({
  entry,
  principles,
}: {
  entry?: EntryInput;
  principles: { step: number; title: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<EntryInput>(entry ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set<K extends keyof EntryInput>(k: K, v: EntryInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit() {
    setError(null);
    start(async () => {
      const r = await saveEntry(form);
      if (r.ok) router.push("/admin/codex");
      else setError(r.error ?? "Save failed.");
    });
  }

  function remove() {
    if (!entry?._id) return;
    if (!confirm("Delete this codex entry?")) return;
    start(async () => {
      await deleteEntry(entry._id!);
      router.push("/admin/codex");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Title">
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Hitting gets a calm, immediate boundary"
        />
      </Field>

      <Field label="Guiding Principle (rung)">
        <select
          className={inputClass}
          value={form.step}
          onChange={(e) => set("step", Number(e.target.value))}
        >
          {principles.map((p) => (
            <option key={p.step} value={p.step}>
              Rung {p.step}: {p.title || "Untitled"}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Core lesson" hint="The specific behavioral lesson this entry teaches.">
        <textarea
          className={`${inputClass} resize-none`}
          rows={2}
          value={form.principle}
          onChange={(e) => set("principle", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Age min">
          <input
            type="number"
            className={inputClass}
            value={form.ageMin}
            onChange={(e) => set("ageMin", Number(e.target.value))}
          />
        </Field>
        <Field label="Age max">
          <input
            type="number"
            className={inputClass}
            value={form.ageMax}
            onChange={(e) => set("ageMax", Number(e.target.value))}
          />
        </Field>
      </div>

      <Field
        label="Triggers"
        hint="Keywords a parent might type — this is what gets the entry matched."
      >
        <ChipInput
          value={form.triggers}
          onChange={(v) => set("triggers", v)}
          placeholder="hitting, bites, won't sleep…"
        />
      </Field>

      <Field label="Guidance" hint="Grounds Do Now / Do Later.">
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={form.guidance}
          onChange={(e) => set("guidance", e.target.value)}
        />
      </Field>

      <Field label="Deep insight" hint="Grounds Go Think (the science).">
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={form.deepInsight}
          onChange={(e) => set("deepInsight", e.target.value)}
        />
      </Field>

      <Field label="Topics (optional)">
        <ChipInput value={form.topics} onChange={(v) => set("topics", v)} />
      </Field>

      <Field label="References (optional)">
        <ChipInput
          value={form.references}
          onChange={(v) => set("references", v)}
        />
      </Field>

      {error && (
        <p className="rounded-xl bg-donow-50 px-3 py-2 text-sm font-medium text-donow">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3 font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save entry"}
        </button>
        {entry?._id && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-2xl border border-donow/30 bg-donow-50 px-4 py-3 font-semibold text-donow transition active:scale-95"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
