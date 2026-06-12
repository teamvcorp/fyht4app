import type {
  Principle,
  TaekwondoProgress,
  LessonProgress,
  BeltTest,
  UserDoc,
} from "@/lib/types";

// One week between lessons. Overridable via TAEKWONDO_WEEK_MS for testing/demo
// (server reads the env; the client display falls back to the 7-day default).
export const WEEK_MS = Number(process.env.TAEKWONDO_WEEK_MS) || 7 * 24 * 60 * 60 * 1000;
export const REQUIRED_WATCHES = 4;
export const BELT_TEST_FEE_CENTS = 2000;
export const BOOK_FEE_CENTS = 2500;

export const lessonKey = (tier: number, belt: number, lesson: number) =>
  `t${tier}b${belt}l${lesson}`;
export const beltKey = (tier: number, belt: number) => `t${tier}b${belt}`;

export function emptyTaekwondo(): TaekwondoProgress {
  return { enrolledTiers: [], lessons: {}, beltTests: {} };
}

export function getTaekwondo(user: UserDoc | null): TaekwondoProgress {
  const tk = user?.taekwondo;
  return {
    enrolledTiers: tk?.enrolledTiers ?? [],
    lessons: tk?.lessons ?? {},
    beltTests: tk?.beltTests ?? {},
  };
}

export function isLessonComplete(lp: LessonProgress | undefined): boolean {
  if (!lp) return false;
  const elapsed = Date.now() - Date.parse(lp.firstAccessedAt);
  return lp.watchCount >= REQUIRED_WATCHES && elapsed >= WEEK_MS;
}

export function weekRemainingMs(lp: LessonProgress | undefined): number {
  if (!lp) return WEEK_MS;
  const elapsed = Date.now() - Date.parse(lp.firstAccessedAt);
  return Math.max(0, WEEK_MS - elapsed);
}

export type LessonState = "locked" | "available" | "in_progress" | "complete";

export interface LessonView {
  beltIndex: number;
  lessonIndex: number;
  name: string;
  instruction: string;
  hasVideo: boolean;
  state: LessonState;
  watchCount: number;
  requiredWatches: number;
  weekRemainingMs: number;
  firstAccessedAt?: string;
}

export interface BeltView {
  index: number;
  name: string;
  unlocked: boolean;
  lessons: LessonView[];
  allLessonsComplete: boolean;
  test: BeltTest & { available: boolean };
}

export interface TierView {
  tier: number;
  title: string;
  enrolled: boolean;
  priceDollars: number;
  belts: BeltView[];
}

/** Belt N unlocks when belt N-1's test is passed; belt 0 unlocks on enrollment. */
function beltUnlocked(
  tier: number,
  beltIndex: number,
  enrolled: boolean,
  tk: TaekwondoProgress
): boolean {
  if (!enrolled) return false;
  if (beltIndex === 0) return true;
  return tk.beltTests[beltKey(tier, beltIndex - 1)]?.status === "passed";
}

/** Builds the full UI state for one tier from the principle + the user's progress. */
export function computeTierView(
  principle: Principle,
  tk: TaekwondoProgress
): TierView {
  const tier = principle.step;
  const enrolled = tk.enrolledTiers.includes(tier);
  const belts = principle.tier?.belts ?? [];

  const beltViews: BeltView[] = belts.map((belt, bi) => {
    const unlocked = beltUnlocked(tier, bi, enrolled, tk);

    let prevComplete = true;
    const lessons: LessonView[] = (belt.lessons ?? []).map((lesson, li) => {
      const lp = tk.lessons[lessonKey(tier, bi, li)];
      const complete = isLessonComplete(lp);
      const available = unlocked && prevComplete;

      let state: LessonState;
      if (!available) state = "locked";
      else if (complete) state = "complete";
      else if (lp) state = "in_progress";
      else state = "available";

      // Next lesson only opens once this one is complete.
      prevComplete = complete;

      return {
        beltIndex: bi,
        lessonIndex: li,
        name: lesson.name,
        instruction: lesson.instruction ?? "",
        hasVideo: !!lesson.videoPathname,
        state,
        watchCount: lp?.watchCount ?? 0,
        requiredWatches: REQUIRED_WATCHES,
        weekRemainingMs: weekRemainingMs(lp),
        firstAccessedAt: lp?.firstAccessedAt,
      };
    });

    const allLessonsComplete =
      lessons.length > 0 && lessons.every((l) => l.state === "complete");
    const test = tk.beltTests[beltKey(tier, bi)] ?? { status: "none" as const };

    return {
      index: bi,
      name: belt.name,
      unlocked,
      lessons,
      allLessonsComplete,
      test: { ...test, available: unlocked && allLessonsComplete },
    };
  });

  return {
    tier,
    title: principle.title,
    enrolled,
    priceDollars: Math.round((principle.tier?.priceCents ?? 0) / 100),
    belts: beltViews,
  };
}

/** Authorization: can the user access (watch) this specific lesson right now? */
export function canAccessLesson(
  principle: Principle,
  tk: TaekwondoProgress,
  beltIndex: number,
  lessonIndex: number
): boolean {
  const view = computeTierView(principle, tk);
  const lesson = view.belts[beltIndex]?.lessons[lessonIndex];
  return (
    !!lesson && (lesson.state === "available" || lesson.state === "in_progress" || lesson.state === "complete")
  );
}
