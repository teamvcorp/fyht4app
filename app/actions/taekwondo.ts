"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/user";
import { usersCollection } from "@/lib/db";
import { getPrinciple } from "@/lib/coach/principles";
import { signedBlobUrl } from "@/lib/blob";
import {
  getTaekwondo,
  lessonKey,
  beltKey,
  canAccessLesson,
  computeTierView,
  WEEK_MS,
  REQUIRED_WATCHES,
} from "@/lib/taekwondo";
import type { UserDoc } from "@/lib/types";

async function me(): Promise<UserDoc> {
  const user = await getCurrentUser();
  if (!user?._id) throw new Error("Unauthorized");
  return user;
}

export async function enrollTier(tier: number): Promise<void> {
  const user = await me();
  const users = await usersCollection();
  await users.updateOne(
    { _id: user._id },
    { $addToSet: { "taekwondo.enrolledTiers": tier } }
  );
  revalidatePath(`/train/${tier}`);
  revalidatePath("/train");
}

/** Opens a lesson: starts its week on first access, returns a signed video URL. */
export async function accessLesson(
  tier: number,
  beltIndex: number,
  lessonIndex: number
): Promise<{ url: string | null; error?: string }> {
  const user = await me();
  const principle = await getPrinciple(tier);
  if (!principle) return { url: null, error: "Tier not found." };

  const tk = getTaekwondo(user);
  if (!canAccessLesson(principle, tk, beltIndex, lessonIndex)) {
    return { url: null, error: "This lesson is locked." };
  }

  const key = lessonKey(tier, beltIndex, lessonIndex);
  const users = await usersCollection();
  if (!tk.lessons[key]) {
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          [`taekwondo.lessons.${key}`]: {
            firstAccessedAt: new Date().toISOString(),
            watchCount: 0,
          },
        },
      }
    );
    revalidatePath(`/train/${tier}`);
  }

  const lesson = principle.tier?.belts?.[beltIndex]?.lessons?.[lessonIndex];
  const url = lesson?.videoPathname
    ? await signedBlobUrl(lesson.videoPathname)
    : null;
  return { url };
}

/** Counts one completed watch (called when the video plays to the end). */
export async function recordWatch(
  tier: number,
  beltIndex: number,
  lessonIndex: number
): Promise<{ watchCount: number }> {
  const user = await me();
  const tk = getTaekwondo(user);
  const key = lessonKey(tier, beltIndex, lessonIndex);
  const lp = tk.lessons[key];
  if (!lp) return { watchCount: 0 };

  const newCount = (lp.watchCount ?? 0) + 1;
  const set: Record<string, unknown> = {
    [`taekwondo.lessons.${key}.watchCount`]: newCount,
  };
  const elapsed = Date.now() - Date.parse(lp.firstAccessedAt);
  if (newCount >= REQUIRED_WATCHES && elapsed >= WEEK_MS && !lp.completedAt) {
    set[`taekwondo.lessons.${key}.completedAt`] = new Date().toISOString();
  }
  const users = await usersCollection();
  await users.updateOne({ _id: user._id }, { $set: set });
  revalidatePath(`/train/${tier}`);
  return { watchCount: newCount };
}

/** Submit the belt-test video (requires all lessons complete + $20 paid). */
export async function submitBeltTest(
  tier: number,
  beltIndex: number,
  url: string,
  pathname: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await me();
  const principle = await getPrinciple(tier);
  if (!principle) return { ok: false, error: "Tier not found." };

  const tk = getTaekwondo(user);
  const view = computeTierView(principle, tk);
  const belt = view.belts[beltIndex];
  if (!belt?.test.available) {
    return { ok: false, error: "Finish all lessons in this belt first." };
  }
  const test = tk.beltTests[beltKey(tier, beltIndex)];
  if (!test?.paidAt) {
    return { ok: false, error: "Pay the $20 testing fee first." };
  }

  const k = beltKey(tier, beltIndex);
  const users = await usersCollection();
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        [`taekwondo.beltTests.${k}.status`]: "submitted",
        [`taekwondo.beltTests.${k}.submissionUrl`]: url,
        [`taekwondo.beltTests.${k}.submissionPathname`]: pathname,
        [`taekwondo.beltTests.${k}.submittedAt`]: new Date().toISOString(),
      },
    }
  );
  revalidatePath(`/train/${tier}`);
  return { ok: true };
}
