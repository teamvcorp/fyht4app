import Link from "next/link";
import { getAllPrinciples } from "@/lib/coach/principles";

export default async function AdminPrinciplesPage() {
  const principles = await getAllPrinciples();
  const byStep = new Map(principles.map((p) => [p.step, p]));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink/45">
        The 5-rung ladder. Each rung is a Taekwondo tier tied to one book.
      </p>
      {[1, 2, 3, 4, 5].map((step) => {
        const p = byStep.get(step);
        const authored = !!p?.title;
        return (
          <Link
            key={step}
            href={`/admin/principles/${step}`}
            className="fyht-card flex items-center justify-between gap-3 p-4 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-black text-white">
                {step}
              </span>
              <div>
                <p className="text-sm font-bold text-ink">
                  {p?.title || "Untitled — needs authoring"}
                </p>
                <p className="text-xs text-ink/45">
                  {p?.factors?.length ?? 0} factors · {p?.rules?.length ?? 0} rules ·{" "}
                  {p?.book?.title ? "book set" : "no book"}
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                authored ? "bg-fyht/10 text-fyht" : "bg-donow-50 text-donow"
              }`}
            >
              {authored ? "Authored" : "Empty"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
