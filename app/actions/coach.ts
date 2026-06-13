"use server";

import { getCurrentUser } from "@/lib/user";
import { canAsk, recordQuestionUse } from "@/lib/quota";
import { runCoach } from "@/lib/coach/engine";
import { getSubject, recentRungCount, STRUGGLE_THRESHOLD } from "@/lib/subjects";
import { getPrinciple } from "@/lib/coach/principles";
import type { CoachResponse } from "@/lib/types";

export type Nudge = { step: number; principleTitle: string; count: number };

export type AskResult =
  | { ok: true; response: CoachResponse; nudge?: Nudge }
  | {
      ok: false;
      reason: "unauthorized" | "empty" | "quota" | "error" | "no_subject";
    };

export async function askCoach(
  question: string,
  subjectId: string
): Promise<AskResult> {
  const user = await getCurrentUser();
  if (!user?._id) return { ok: false, reason: "unauthorized" };

  const trimmed = (question || "").trim().slice(0, 1000);
  if (!trimmed) return { ok: false, reason: "empty" };

  if (!subjectId) return { ok: false, reason: "no_subject" };
  const subject = await getSubject(user._id.toString(), subjectId);
  if (!subject) return { ok: false, reason: "no_subject" };

  if (!canAsk(user)) return { ok: false, reason: "quota" };

  let response: CoachResponse;
  try {
    response = await runCoach(user, trimmed, { subject });
  } catch (err) {
    console.error("coach engine error:", err);
    return { ok: false, reason: "error" };
  }

  // Every question counts against the daily allowance (caps Claude token spend).
  await recordQuestionUse(user._id.toString());

  // Pattern nudge: same subject keeps landing on the same rung.
  let nudge: Nudge | undefined;
  if (response.groundedInCodex && response.routedStep) {
    const count = await recentRungCount(
      user._id.toString(),
      subjectId,
      response.routedStep
    );
    if (count >= STRUGGLE_THRESHOLD) {
      const principle = await getPrinciple(response.routedStep);
      nudge = {
        step: response.routedStep,
        principleTitle: principle?.title || `Tier ${response.routedStep}`,
        count,
      };
    }
  }

  return { ok: true, response, nudge };
}
