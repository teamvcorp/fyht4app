import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import {
  JourneyLadder,
  type RungView,
  type ProgressView,
} from "@/components/JourneyLadder";
import { getCurrentUser, isActiveMember, isAdminUser } from "@/lib/user";
import { getAllPrinciples } from "@/lib/coach/principles";
import { lowestUnlearnedStepOf, isEnrolledTier, ownsBook } from "@/lib/progress";
import {
  getSubject,
  canVerifySubjectRung,
  recentRungCount,
} from "@/lib/subjects";

export default async function SubjectJourneyPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const user = await getCurrentUser();
  if (!user?._id) notFound();

  const subject = await getSubject(user._id.toString(), subjectId);
  if (!subject) notFound();

  const principles = await getAllPrinciples();
  const byStep = new Map(principles.map((p) => [p.step, p]));
  const currentStep = lowestUnlearnedStepOf(subject.progress);
  const userId = user._id.toString();

  const rungs: RungView[] = [];
  for (const step of [1, 2, 3, 4, 5]) {
    const p = byStep.get(step);
    rungs.push({
      step,
      title: p?.title ?? "",
      about: p?.about ?? "",
      factors: (p?.factors ?? []).map((f) => f.name).filter(Boolean),
      priceDollars: Math.round((p?.tier?.priceCents ?? 0) / 100),
      enrolled: isEnrolledTier(user, step),
      bookOwned: ownsBook(user, step),
      canMaster: await canVerifySubjectRung(user, step),
      recentCount: await recentRungCount(userId, subjectId, step),
    });
  }

  const progress: ProgressView = {};
  for (const step of [1, 2, 3, 4, 5]) {
    const up = subject.progress?.principles?.[step];
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-ink">
            {subject.firstName}{" "}
            <span className="text-base font-bold text-ink/40">
              · {subject.ageYears}
            </span>
          </h1>
          <Link href="/journey" className="text-xs font-semibold text-brand">
            ← All journeys
          </Link>
        </div>
        <JourneyLadder
          subjectId={subjectId}
          rungs={rungs}
          progress={progress}
          currentStep={currentStep}
        />
      </main>
    </>
  );
}
