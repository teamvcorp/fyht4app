"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/user";
import { setPrincipleStatus, setFactor, canMasterTier } from "@/lib/progress";

export async function markMastered(
  step: number,
  mastered: boolean
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user?._id) return { ok: false, error: "Not signed in." };

  // Downgrading (back to learning) is always allowed; mastering is gated.
  if (mastered && !canMasterTier(user, step)) {
    return {
      ok: false,
      error: "Read this tier's book or enroll in Taekwondo to master it.",
    };
  }

  await setPrincipleStatus(
    user._id.toString(),
    step,
    mastered ? "mastered" : "learning"
  );
  revalidatePath("/journey");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleFactor(
  step: number,
  factor: string,
  value: boolean
): Promise<void> {
  const user = await getCurrentUser();
  if (!user?._id) return;
  await setFactor(user._id.toString(), step, factor, value);
  revalidatePath("/journey");
}
