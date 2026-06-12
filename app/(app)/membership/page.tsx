import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { UpgradeButton } from "@/components/UpgradeButton";
import { getCurrentUser, isActiveMember, isAdminUser } from "@/lib/user";
import { MEMBER_QUESTIONS_PER_DAY } from "@/lib/quota";

const MEMBER_BENEFITS = [
  `Up to ${MEMBER_QUESTIONS_PER_DAY} coaching questions every day`,
  "Full Do Now / Do Later / Go Think on every answer",
  "Access The Master without enrolling in Taekwondo",
  "Cancel anytime",
];

export default async function MembershipPage() {
  const user = await getCurrentUser();
  const isMember = isActiveMember(user);

  return (
    <>
      <AppHeader name={user?.name} isMember={isMember} isAdmin={isAdminUser(user)} />
      <main className="mt-4 flex flex-1 flex-col gap-5 px-4">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
            🥋 Membership
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-ink">
            {isMember ? "You're a member" : "Become a member"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            {isMember
              ? "Thank you for backing Black Belt Parenting. Ask The Master whenever family life throws a curveball."
              : "Free gives you one question a day. Membership opens daily coaching with The Master — no Taekwondo required."}
          </p>
        </div>

        <div className="fyht-card overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-700 to-fyht" />
          <div className="p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-extrabold text-ink">Basic Membership</h2>
              <span className="text-sm font-bold text-ink/60">
                <span className="text-xl text-ink">$25</span>/mo
              </span>
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {MEMBER_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-ink/80">
                  <span className="mt-0.5 text-fyht" aria-hidden>
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {isMember ? (
                <Link
                  href="/"
                  className="flex w-full items-center justify-center rounded-2xl bg-brand-50 px-5 py-3.5 text-base font-bold text-brand transition active:scale-[0.99]"
                >
                  Back to The Master
                </Link>
              ) : (
                <UpgradeButton label="Become a member" />
              )}
            </div>
          </div>
        </div>

        {/* The deeper commitment: the Taekwondo program */}
        <Link
          href="/train"
          className="fyht-card flex items-center gap-3 p-4 transition active:scale-[0.99]"
        >
          <span className="text-2xl" aria-hidden>
            🥋
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Taekwondo program</p>
            <p className="text-xs text-ink/55">
              Paced lessons, belt tests, and a real black belt — the deeper path.
            </p>
          </div>
          <span className="text-ink/30">→</span>
        </Link>

        <Link href="/" className="text-center text-sm font-semibold text-brand">
          Maybe later
        </Link>
      </main>
    </>
  );
}
