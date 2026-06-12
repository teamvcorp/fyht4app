import { AppHeader } from "@/components/AppHeader";
import {
  JourneyLadder,
  type RungView,
  type ProgressView,
} from "@/components/JourneyLadder";
import { getCurrentUser, isActiveMember, isAdminUser } from "@/lib/user";
import { getAllPrinciples } from "@/lib/coach/principles";
import {
  lowestUnlearnedStep,
  isEnrolledTier,
  ownsBook,
  canMasterTier,
} from "@/lib/progress";

export default async function JourneyPage() {
  const user = await getCurrentUser();
  const principles = await getAllPrinciples();
  const byStep = new Map(principles.map((p) => [p.step, p]));
  const currentStep = lowestUnlearnedStep(user);

  const rungs: RungView[] = [1, 2, 3, 4, 5].map((step) => {
    const p = byStep.get(step);
    return {
      step,
      title: p?.title ?? "",
      about: p?.about ?? "",
      factors: (p?.factors ?? []).map((f) => f.name).filter(Boolean),
      priceDollars: Math.round((p?.tier?.priceCents ?? 0) / 100),
      enrolled: isEnrolledTier(user, step),
      bookOwned: ownsBook(user, step),
      canMaster: canMasterTier(user, step),
    };
  });

  const progress: ProgressView = {};
  for (const step of [1, 2, 3, 4, 5]) {
    const up = user?.progress?.principles?.[step];
    progress[step] = {
      mastered: up?.status === "mastered",
      factors: up?.factors ?? {},
    };
  }

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
            Your Journey
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">
            Five rungs, learned in order. The Master meets you where you are —
            master each tier to unlock the next. Taekwondo accelerates and
            certifies your progress.
          </p>
        </div>
        <JourneyLadder
          rungs={rungs}
          progress={progress}
          currentStep={currentStep}
        />
      </main>
    </>
  );
}
