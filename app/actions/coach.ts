"use server";

import { getCurrentUser } from "@/lib/user";
import { canAsk, recordQuestionUse } from "@/lib/quota";
import { runCoach } from "@/lib/coach/engine";
import type { CoachResponse } from "@/lib/types";

export type AskResult =
  | { ok: true; response: CoachResponse }
  | { ok: false; reason: "unauthorized" | "empty" | "quota" | "error" };

export async function askCoach(question: string): Promise<AskResult> {
  const user = await getCurrentUser();
  if (!user?._id) return { ok: false, reason: "unauthorized" };

  const trimmed = (question || "").trim().slice(0, 1000);
  if (!trimmed) return { ok: false, reason: "empty" };

  if (!canAsk(user)) return { ok: false, reason: "quota" };

  let response: CoachResponse;
  try {
    response = await runCoach(user, trimmed);
  } catch (err) {
    console.error("coach engine error:", err);
    return { ok: false, reason: "error" };
  }

  // Every question (free or member) counts against the daily allowance — this
  // caps Claude token spend even for paying members.
  await recordQuestionUse(user._id.toString());

  return { ok: true, response };
}
