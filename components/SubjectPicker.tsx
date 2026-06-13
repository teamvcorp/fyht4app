"use client";

import { useState, useTransition } from "react";
import { addSubject, type SubjectView } from "@/app/actions/subjects";

export function SubjectPicker({
  initialSubjects,
  selectedId,
  onSelect,
}: {
  initialSubjects: SubjectView[];
  selectedId: string | null;
  onSelect: (s: SubjectView) => void;
}) {
  const [subjects, setSubjects] = useState<SubjectView[]>(initialSubjects);
  const [adding, setAdding] = useState(initialSubjects.length === 0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    setError(null);
    start(async () => {
      const r = await addSubject(name, Number(age));
      if (r.ok && r.subject) {
        setSubjects((s) => [...s, r.subject!]);
        onSelect(r.subject);
        setName("");
        setAge("");
        setAdding(false);
      } else {
        setError(r.error ?? "Could not add.");
      }
    });
  }

  return (
    <div className="w-full">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/50">
        Who&apos;s this about?
      </p>
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => {
          const active = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              className={`rounded-full px-3.5 py-2 text-sm font-bold transition active:scale-95 ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-ink/70 ring-1 ring-brand/15"
              }`}
            >
              {s.firstName}
              <span className={active ? "text-white/70" : "text-ink/40"}>
                {" "}
                · {s.ageYears}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="rounded-full bg-brand-50 px-3.5 py-2 text-sm font-bold text-brand active:scale-95"
        >
          + Add
        </button>
      </div>

      {adding && (
        <div className="mt-2 flex flex-col gap-2 rounded-2xl bg-white p-3 ring-1 ring-brand/10">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              maxLength={40}
              className="flex-1 rounded-xl bg-brand-50/60 px-3 py-2 text-sm outline-none placeholder:text-ink/35 focus:bg-brand-50"
            />
            <input
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="Age"
              className="w-20 rounded-xl bg-brand-50/60 px-3 py-2 text-sm outline-none placeholder:text-ink/35 focus:bg-brand-50"
            />
            <button
              type="button"
              onClick={add}
              disabled={pending || !name.trim() || !age}
              className="rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
            >
              {pending ? "…" : "Add"}
            </button>
          </div>
          {error && <p className="text-xs font-medium text-donow">{error}</p>}
        </div>
      )}
    </div>
  );
}
