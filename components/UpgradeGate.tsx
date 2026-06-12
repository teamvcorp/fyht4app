import Link from "next/link";

export function UpgradeGate() {
  return (
    <div className="fyht-card animate-pop overflow-hidden ring-1 ring-brand/15">
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-700 to-fyht" />
      <div className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
          🔒
        </div>
        <h2 className="text-lg font-extrabold text-ink">
          That&apos;s your free question for today
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Become a member for unlimited coaching from The Master — every
          challenge, every day, whenever you need it.
        </p>
        <Link
          href="/membership"
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3.5 font-bold text-white shadow-md transition active:scale-[0.99]"
        >
          Unlock unlimited — become a member
        </Link>
        <p className="mt-3 text-xs text-ink/50">
          Or come back tomorrow for another free question.
        </p>
      </div>
    </div>
  );
}
