import { ObjectId } from "mongodb";
import { usersCollection } from "@/lib/db";
import type { UserDoc } from "@/lib/types";

/** Current calendar day in UTC as YYYY-MM-DD. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const FREE_QUESTIONS_PER_DAY = 1;
// Members get a generous but capped daily allowance so a heavy user can never
// burn more in Claude tokens than the $25/mo subscription covers.
export const MEMBER_QUESTIONS_PER_DAY =
  Number(process.env.MEMBER_DAILY_LIMIT) || 10;

export function dailyLimit(user: UserDoc | null): number {
  return user?.subscriptionStatus === "active"
    ? MEMBER_QUESTIONS_PER_DAY
    : FREE_QUESTIONS_PER_DAY;
}

export function questionsUsedToday(user: UserDoc): number {
  const today = todayKey();
  return user.freeUse?.date === today ? user.freeUse.count : 0;
}

/** Free: 1/day. Members: capped daily allowance. */
export function canAsk(user: UserDoc): boolean {
  return questionsUsedToday(user) < dailyLimit(user);
}

/** Record one question against today's allowance (applies to free AND members). */
export async function recordQuestionUse(userId: string): Promise<void> {
  const users = await usersCollection();
  const today = todayKey();
  const _id = new ObjectId(userId);

  const user = await users.findOne({ _id });
  if (user?.freeUse?.date === today) {
    await users.updateOne({ _id }, { $inc: { "freeUse.count": 1 } });
  } else {
    await users.updateOne(
      { _id },
      { $set: { freeUse: { date: today, count: 1 } } }
    );
  }
}
