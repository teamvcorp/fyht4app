import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TrainTier } from "@/components/TrainTier";
import { getCurrentUser, isActiveMember, isAdminUser } from "@/lib/user";
import { getPrinciple } from "@/lib/coach/principles";
import { getTaekwondo, computeTierView } from "@/lib/taekwondo";

export default async function TrainTierPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier: tierStr } = await params;
  const tier = Number(tierStr);
  if (!Number.isInteger(tier) || tier < 1 || tier > 5) notFound();

  const user = await getCurrentUser();
  const principle = await getPrinciple(tier);
  if (!principle) notFound();

  const tk = getTaekwondo(user);
  const view = computeTierView(principle, tk);

  return (
    <>
      <AppHeader
        name={user?.name}
        isMember={isActiveMember(user)}
        isAdmin={isAdminUser(user)}
      />
      <main className="mt-4 flex flex-1 flex-col gap-4 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight text-ink">
            Tier {tier}: {view.title || "Coming soon"}
          </h1>
          <Link href="/train" className="text-xs font-semibold text-brand">
            ← All tiers
          </Link>
        </div>
        <TrainTier view={view} />
      </main>
    </>
  );
}
