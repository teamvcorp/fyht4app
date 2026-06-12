import { LessonPlayer } from "@/components/LessonPlayer";
import { BeltTest } from "@/components/BeltTest";
import { EnrollButton } from "@/components/EnrollButton";
import type { TierView } from "@/lib/taekwondo";

export function TrainTier({ view }: { view: TierView }) {
  if (!view.enrolled) {
    return (
      <div className="fyht-card p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
          🥋
        </div>
        <h2 className="text-lg font-extrabold text-ink">
          Tier {view.tier}: {view.title || "Coming soon"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          Enroll to begin the belts — one lesson a week, watched to mastery, with
          a belt test before each promotion. Real black belt at the summit.
        </p>
        <div className="mt-4">
          <EnrollButton tier={view.tier} priceDollars={view.priceDollars} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {view.belts.map((belt) => {
        if (!belt.unlocked) {
          return (
            <div key={belt.index} className="fyht-card p-4 opacity-60">
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <span>🔒</span> {belt.name || `Belt ${belt.index + 1}`}
              </p>
              <p className="mt-1 text-xs text-ink/45">
                Unlocks when you pass the previous belt&apos;s test.
              </p>
            </div>
          );
        }

        const current = belt.lessons.find(
          (l) => l.state === "available" || l.state === "in_progress"
        );

        return (
          <div key={belt.index} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-black uppercase tracking-wide text-brand">
                {belt.name || `Belt ${belt.index + 1}`}
              </p>
              {belt.test.status === "passed" && (
                <span className="rounded-full bg-fyht/10 px-2.5 py-1 text-[10px] font-bold uppercase text-fyht">
                  Passed
                </span>
              )}
            </div>

            {belt.lessons.map((lesson) => {
              if (lesson.state === "complete") {
                return (
                  <div
                    key={lesson.lessonIndex}
                    className="flex items-center gap-2 px-2 text-sm text-ink/55"
                  >
                    <span className="text-fyht">✓</span>
                    {lesson.name || `Lesson ${lesson.lessonIndex + 1}`}
                  </div>
                );
              }
              if (lesson === current) {
                return (
                  <LessonPlayer
                    key={lesson.lessonIndex}
                    tier={view.tier}
                    lesson={lesson}
                  />
                );
              }
              return (
                <div
                  key={lesson.lessonIndex}
                  className="flex items-center gap-2 px-2 text-sm text-ink/35"
                >
                  <span>🔒</span>
                  {lesson.name || `Lesson ${lesson.lessonIndex + 1}`}
                </div>
              );
            })}

            {belt.test.available && <BeltTest tier={view.tier} belt={belt} />}
          </div>
        );
      })}
    </div>
  );
}
