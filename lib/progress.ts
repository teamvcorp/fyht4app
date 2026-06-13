import { ObjectId } from "mongodb";
import { usersCollection } from "@/lib/db";
import { TOTAL_STEPS } from "@/lib/coach/principles";
import type { UserDoc, UserProgress, PrincipleStatus } from "@/lib/types";

/** Default ladder state for a brand-new user: rung 1 unlocked, rest locked. */
export function defaultProgress(): UserProgress {
  const principles: UserProgress["principles"] = {};
  for (let step = 1; step <= TOTAL_STEPS; step++) {
    principles[step] = { status: step === 1 ? "learning" : "locked" };
  }
  return { principles };
}

/**
 * The lowest rung NOT yet mastered in a progress object — the highest rung the
 * coach will route a problem to. (If everything is mastered, returns TOTAL_STEPS.)
 */
export function lowestUnlearnedStepOf(progress?: UserProgress): number {
  const principles = progress?.principles;
  if (!principles) return 1;
  for (let step = 1; step <= TOTAL_STEPS; step++) {
    if (principles[step]?.status !== "mastered") return step;
  }
  return TOTAL_STEPS;
}

export function lowestUnlearnedStep(user: UserDoc | null): number {
  return lowestUnlearnedStepOf(user?.progress);
}

/** Ensure a user has a progress object; returns it. */
export function ensureProgress(user: UserDoc): UserProgress {
  return user.progress ?? defaultProgress();
}

export function ownsBook(user: UserDoc | null, tier: number): boolean {
  return !!user?.booksOwned?.includes(tier);
}

export function isEnrolledTier(user: UserDoc | null, tier: number): boolean {
  return !!user?.taekwondo?.enrolledTiers?.includes(tier);
}

/**
 * A tier may only be marked mastered once the user has committed to the work —
 * either by enrolling in that tier's Taekwondo OR by buying that tier's book.
 */
export function canMasterTier(user: UserDoc | null, tier: number): boolean {
  return isEnrolledTier(user, tier) || ownsBook(user, tier);
}

export async function setPrincipleStatus(
  userId: string,
  step: number,
  status: PrincipleStatus
): Promise<void> {
  const users = await usersCollection();
  await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        [`progress.principles.${step}.status`]: status,
        [`progress.principles.${step}.source`]: "self",
        [`progress.principles.${step}.updatedAt`]: new Date(),
      },
    }
  );
}

export async function setFactor(
  userId: string,
  step: number,
  factorName: string,
  value: boolean
): Promise<void> {
  const users = await usersCollection();
  await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        [`progress.principles.${step}.factors.${factorName}`]: value,
        [`progress.principles.${step}.updatedAt`]: new Date(),
      },
    }
  );
}
