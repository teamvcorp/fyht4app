import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { AddSubjectButton } from "@/components/AddSubjectButton";
import { getCurrentUser, isActiveMember, isAdminUser } from "@/lib/user";
import { getAllPrinciples } from "@/lib/coach/principles";
import { lowestUnlearnedStepOf } from "@/lib/progress";
import { listSubjects } from "@/lib/subjects";

export default async function JourneyHub() {
  const user = await getCurrentUser();
  const subjects = user?._id ? await listSubjects(user._id.toString()) : [];
  const principles = await getAllPrinciples();
  const titleOf = (step: number) =>
    principles.find((p) => p.step === step)?.title ?? "";

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
            Journeys
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">
            Track each person up the ladder. The Master meets them exactly where
            they are — and routes every answer to their growth edge.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {subjects.map((s) => {
            const step = lowestUnlearnedStepOf(s.progress);
            return (
              <Link
                key={s._id!.toString()}
                href={`/journey/${s._id!.toString()}`}
                className="fyht-card flex items-center justify-between gap-3 p-4 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-black uppercase text-white">
                    {s.firstName.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {s.firstName} · {s.ageYears}
                    </p>
                    <p className="text-xs text-ink/45">
                      Tier {step}: {titleOf(step) || "Coming soon"}
                    </p>
                  </div>
                </div>
                <span className="text-ink/30">→</span>
              </Link>
            );
          })}
          {subjects.length === 0 && (
            <p className="py-4 text-center text-sm text-ink/45">
              No one added yet — add the first person you coach.
            </p>
          )}
        </div>

        <AddSubjectButton />
      </main>
    </>
  );
}
