import Link from "next/link";
import type { CoachResponse as CoachResponseType } from "@/lib/types";

function Section({
  label,
  emoji,
  body,
  accent,
}: {
  label: string;
  emoji: string;
  body: string;
  accent: "donow" | "dolater" | "gothink";
}) {
  const styles = {
    donow: { bar: "bg-donow", chip: "bg-donow-50 text-donow", ring: "ring-donow/15" },
    dolater: { bar: "bg-dolater", chip: "bg-dolater-50 text-dolater", ring: "ring-dolater/15" },
    gothink: { bar: "bg-gothink", chip: "bg-gothink-50 text-gothink", ring: "ring-gothink/15" },
  }[accent];

  return (
    <section className={`fyht-card animate-rise overflow-hidden ring-1 ${styles.ring}`}>
      <div className={`h-1.5 w-full ${styles.bar}`} />
      <div className="p-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles.chip}`}
        >
          <span aria-hidden>{emoji}</span>
          {label}
        </span>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/90">{body}</p>
      </div>
    </section>
  );
}

export function CoachResponse({ response }: { response: CoachResponseType }) {
  const book = response.recommendedBook;

  return (
    <div className="flex flex-col gap-4">
      {/* Routed rung tag + prerequisite reason */}
      {response.groundedInCodex && response.routedStep && (
        <div className="flex flex-col gap-2">
          <Link
            href="/journey"
            className="self-start rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand"
          >
            Tier {response.routedStep}
            {response.routedPrincipleTitle
              ? `: ${response.routedPrincipleTitle}`
              : ""}
          </Link>
          {response.routedReason && (
            <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-ink/80">
              {response.routedReason}
            </p>
          )}
        </div>
      )}

      <Section label="Do Now" emoji="⚡" body={response.doNow} accent="donow" />

      <section className="fyht-card animate-rise overflow-hidden ring-1 ring-dolater/15 [animation-delay:60ms]">
        <div className="h-1.5 w-full bg-dolater" />
        <div className="p-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-dolater-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-dolater">
            <span aria-hidden>🌱</span>
            Do Later
          </span>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/90">
            {response.doLater}
          </p>

          <div className="mt-4 flex flex-col gap-2.5">
            {book &&
              (book.url ? (
                <a
                  href={book.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border-2 border-dolater/30 bg-dolater-50 px-4 py-3 text-dolater transition active:scale-[0.99]"
                >
                  <BookLabel title={book.title} author={book.author} />
                  <span className="opacity-70 transition group-hover:translate-x-0.5">→</span>
                </a>
              ) : (
                <Link
                  href="/membership?from=book"
                  className="group flex items-center justify-between rounded-2xl border-2 border-dolater/30 bg-dolater-50 px-4 py-3 text-dolater transition active:scale-[0.99]"
                >
                  <BookLabel title={book.title} author={book.author} />
                  <span className="opacity-70 transition group-hover:translate-x-0.5">→</span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <Section label="Go Think" emoji="🧠" body={response.goThink} accent="gothink" />

      {!response.groundedInCodex && (
        <p className="px-2 text-center text-xs text-ink/50">
          This question fell outside The Master&apos;s codex — try a parenting,
          bonding, or family-management topic.
        </p>
      )}
    </div>
  );
}

function BookLabel({ title, author }: { title: string; author?: string }) {
  return (
    <span className="flex items-center gap-2 font-semibold">
      <span aria-hidden className="text-lg">📖</span>
      <span className="min-w-0">
        <span className="block truncate">
          {title ? `Read: ${title}` : "Order the matching book"}
        </span>
        {author && (
          <span className="block text-xs font-normal text-dolater/70">
            by {author}
          </span>
        )}
      </span>
    </span>
  );
}
