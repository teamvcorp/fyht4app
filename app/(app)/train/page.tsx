import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser, isActiveMember, isAdminUser } from "@/lib/user";
import { getAllPrinciples } from "@/lib/coach/principles";
import { getTaekwondo } from "@/lib/taekwondo";

export default async function TrainPage() {
  const user = await getCurrentUser();
  const principles = await getAllPrinciples();
  const tk = getTaekwondo(user);

  return (
    <>
      <AppHeader
        name={user?.name}
        isMember={isActiveMember(user)}
        isAdmin={isAdminUser(user)}
      />
      <main className="mt-4 flex flex-1 flex-col gap-4 px-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">
            Taekwondo
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">
            One lesson a week, watched to mastery. Pass a belt test before each
            promotion. Finish all five tiers to earn a real black belt.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {principles.map((p) => {
            const enrolled = tk.enrolledTiers.includes(p.step);
            const beltCount = p.tier?.belts?.length ?? 0;
            return (
              <Link
                key={p.step}
                href={`/train/${p.step}`}
                className="fyht-card flex items-center justify-between gap-3 p-4 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-black text-white">
                    {p.step}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      Tier {p.step}: {p.title || "Coming soon"}
                    </p>
                    <p className="text-xs text-ink/45">
                      {beltCount} belt{beltCount === 1 ? "" : "s"} ·{" "}
                      ${Math.round((p.tier?.priceCents ?? 0) / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    enrolled ? "bg-fyht/10 text-fyht" : "bg-brand-50 text-brand"
                  }`}
                >
                  {enrolled ? "Enrolled" : "Enroll"}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
