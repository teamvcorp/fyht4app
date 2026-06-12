import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { CoachScreen } from "@/components/CoachScreen";
import { getCurrentUser, isActiveMember, isAdminUser } from "@/lib/user";
import { getAllPrinciples } from "@/lib/coach/principles";
import { lowestUnlearnedStep } from "@/lib/progress";
import { dailyLimit } from "@/lib/quota";

export default async function HomePage() {
  const user = await getCurrentUser();
  const isMember = isActiveMember(user);

  const principles = await getAllPrinciples();
  const currentStep = lowestUnlearnedStep(user);
  const currentTitle =
    principles.find((p) => p.step === currentStep)?.title ?? "";

  return (
    <>
      <AppHeader name={user?.name} isMember={isMember} isAdmin={isAdminUser(user)} />
      <main className="mt-3 flex-1">
        {currentTitle && (
          <Link
            href="/journey"
            className="mx-4 mb-1 flex items-center justify-between rounded-full bg-white px-4 py-2 text-xs shadow-sm ring-1 ring-brand/10"
          >
            <span className="font-bold text-brand">
              Tier {currentStep}: {currentTitle}
            </span>
            <span className="text-ink/45">Your journey →</span>
          </Link>
        )}
        <CoachScreen isMember={isMember} dailyLimit={dailyLimit(user)} />
      </main>
    </>
  );
}
