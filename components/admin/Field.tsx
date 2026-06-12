export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-ink/50">
        {label}
      </span>
      {hint && <span className="-mt-1 text-xs text-ink/45">{hint}</span>}
      {children}
    </label>
  );
}

export const inputClass =
  "rounded-2xl bg-brand-50/60 px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/35 focus:bg-brand-50";
