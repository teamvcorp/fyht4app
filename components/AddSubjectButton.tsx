"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSubject } from "@/app/actions/subjects";

export function AddSubjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    setError(null);
    start(async () => {
      const r = await addSubject(name, Number(age));
      if (r.ok && r.subject) router.push(`/journey/${r.subject.id}`);
      else setError(r.error ?? "Could not add.");
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-brand-50 px-5 py-3 text-sm font-bold text-brand active:scale-95"
      >
        + Add someone
      </button>
    );
  }

  return (
    <div className="fyht-card flex flex-col gap-2 p-3">
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
  );
}
