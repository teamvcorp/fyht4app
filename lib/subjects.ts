import { ObjectId } from "mongodb";
import { subjectsCollection, conversationsCollection } from "@/lib/db";
import { ownsBook } from "@/lib/progress";
import type { SubjectDoc, UserDoc, PrincipleStatus } from "@/lib/types";

export const STRUGGLE_THRESHOLD = Number(process.env.STRUGGLE_THRESHOLD) || 3;
export const STRUGGLE_WINDOW_DAYS =
  Number(process.env.STRUGGLE_WINDOW_DAYS) || 7;

export async function listSubjects(userId: string): Promise<SubjectDoc[]> {
  const col = await subjectsCollection();
  return col.find({ userId }).sort({ createdAt: 1 }).toArray();
}

/** Fetch a subject, scoped to its owner (returns null if not owned). */
export async function getSubject(
  userId: string,
  subjectId: string
): Promise<SubjectDoc | null> {
  const col = await subjectsCollection();
  try {
    return await col.findOne({ _id: new ObjectId(subjectId), userId });
  } catch {
    return null;
  }
}

/**
 * Whether the parent may mark a subject's rung mastered: they own that tier's
 * book. One purchase covers all the user's subjects.
 */
export function canVerifySubjectRung(
  user: UserDoc | null,
  tier: number
): boolean {
  return ownsBook(user, tier);
}

/** How many times this subject has been routed to `step` within the window. */
export async function recentRungCount(
  userId: string,
  subjectId: string,
  step: number,
  days: number = STRUGGLE_WINDOW_DAYS
): Promise<number> {
  const conversations = await conversationsCollection();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return conversations.countDocuments({
    userId,
    subjectId,
    routedStep: step,
    createdAt: { $gte: since },
  });
}

export async function setSubjectStatus(
  userId: string,
  subjectId: string,
  step: number,
  status: PrincipleStatus
): Promise<void> {
  const col = await subjectsCollection();
  await col.updateOne(
    { _id: new ObjectId(subjectId), userId },
    {
      $set: {
        [`progress.principles.${step}.status`]: status,
        [`progress.principles.${step}.source`]: "self",
        [`progress.principles.${step}.updatedAt`]: new Date(),
      },
    }
  );
}

export async function setSubjectFactorValue(
  userId: string,
  subjectId: string,
  step: number,
  factorName: string,
  value: boolean
): Promise<void> {
  const col = await subjectsCollection();
  await col.updateOne(
    { _id: new ObjectId(subjectId), userId },
    {
      $set: {
        [`progress.principles.${step}.factors.${factorName}`]: value,
        [`progress.principles.${step}.updatedAt`]: new Date(),
      },
    }
  );
}
