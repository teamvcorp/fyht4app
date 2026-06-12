"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { accessLesson, recordWatch } from "@/app/actions/taekwondo";
import type { LessonView } from "@/lib/taekwondo";

const DAY = 24 * 60 * 60 * 1000;

export function LessonPlayer({
  tier,
  lesson,
}: {
  tier: number;
  lesson: LessonView;
}) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [count, setCount] = useState(lesson.watchCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    const r = await accessLesson(tier, lesson.beltIndex, lesson.lessonIndex);
    setLoading(false);
    if (r.url) {
      setUrl(r.url);
      router.refresh();
    } else {
      setError(r.error ?? "Couldn't open this lesson.");
    }
  }

  async function onEnded() {
    const r = await recordWatch(tier, lesson.beltIndex, lesson.lessonIndex);
    setCount(r.watchCount);
    router.refresh();
  }

  const notStarted = lesson.state === "available";
  const daysLeft = Math.ceil(lesson.weekRemainingMs / DAY);
  const watchesLeft = Math.max(0, lesson.requiredWatches - count);

  return (
    <div className="fyht-card overflow-hidden ring-1 ring-brand/15">
      <div className="h-1.5 w-full bg-brand" />
      <div className="p-4">
        <p className="text-sm font-bold text-ink">
          {lesson.name || `Lesson ${lesson.lessonIndex + 1}`}
        </p>

        {lesson.instruction && (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/75">
            {lesson.instruction}
          </p>
        )}

        {!lesson.hasVideo && (
          <p className="mt-2 text-xs text-ink/45">
            (No video uploaded for this lesson yet.)
          </p>
        )}

        {url ? (
          <video
            src={url}
            controls
            onEnded={onEnded}
            className="mt-3 w-full rounded-xl bg-black"
          />
        ) : (
          lesson.hasVideo && (
            <button
              type="button"
              onClick={open}
              disabled={loading}
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3 font-bold text-white shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              {loading
                ? "Opening…"
                : notStarted
                  ? "Start this week's lesson"
                  : "Watch the lesson"}
            </button>
          )
        )}

        {notStarted && (
          <p className="mt-2 text-xs text-ink/50">
            Starting this lesson begins its week. You'll watch it at least{" "}
            {lesson.requiredWatches}× over the next 7 days.
          </p>
        )}

        {!notStarted && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span
              className={`rounded-full px-2.5 py-1 ${
                watchesLeft === 0
                  ? "bg-fyht/10 text-fyht"
                  : "bg-donow-50 text-donow"
              }`}
            >
              Watched {count}/{lesson.requiredWatches}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 ${
                lesson.weekRemainingMs === 0
                  ? "bg-fyht/10 text-fyht"
                  : "bg-brand-50 text-brand"
              }`}
            >
              {lesson.weekRemainingMs === 0
                ? "Week complete"
                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left this week`}
            </span>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs font-medium text-donow">{error}</p>
        )}
      </div>
    </div>
  );
}
