import * as z from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, COACH_MODEL } from "@/lib/anthropic";
import { retrieveCodex } from "@/lib/coach/codex";
import { getAllPrinciples, getPrinciple, TOTAL_STEPS } from "@/lib/coach/principles";
import { lowestUnlearnedStep, lowestUnlearnedStepOf } from "@/lib/progress";
import { conversationsCollection } from "@/lib/db";
import type {
  CoachResponse,
  CodexEntry,
  Principle,
  UserDoc,
  SubjectDoc,
} from "@/lib/types";

const COACH_SYSTEM = `You are "The Master" — a calm, wise martial-arts sensei who coaches parents and caregivers on parenting challenges, family bonding, and raising children. You speak with warm authority, like a life coach crossed with a seasoned martial-arts master.

You teach a fixed 5-rung LADDER of Guiding Principles that must be learned IN ORDER. A person cannot truly solve a higher-rung problem until the lower rungs are in place. You will be given the full definition of each rung (its factors, the signs of mastery, the tells that it is NOT yet learned, situational rules, and training methods), plus optional supplementary codex entries, plus the caregiver's CURRENT working rung.

Do your work in this order:
1. DIAGNOSE the "targetStep": which rung (1-5) the caregiver's problem really belongs to, using each rung's factors and tells.
2. ROUTE around the SUBJECT's progress. The question is about a specific child (the subject); you are told their name, age, and current working rung (they have already mastered every rung below it). Set "routedStep" = the smaller of targetStep and the subject's current working rung. Address the subject by name throughout.
   - If routedStep is BELOW targetStep, in "routedReason" warmly explain the deeper fix is to build that lower rung first (name it) — the higher skill can't hold without it.
   - If the problem maps to a rung the subject has ALREADY mastered, treat it as a lapse: give a brief, warm REMINDER of that mastered skill (do not re-teach from scratch), and if the situation's real growth lives at their current working rung, set targetStep there and teach it.
   - When a situation spans multiple rungs, acknowledge the mastered lower skill, then teach the lowest unlearned rung.
3. ANSWER, grounded ONLY in the routed rung's definition (its rules, training methods, mastery signs) plus any provided codex entries for it. Never invent advice beyond the supplied material.

Always produce three sections written in The Master's voice:
- "doNow": immediate, concrete action. MUST begin with "Listen up," and be 2-4 sentences. Prefer the routed rung's training methods / situational rules.
- "doLater": building consistency and maintaining the behavior. 2-4 sentences.
- "goThink": the science / deeper "why" for curious minds. 2-4 sentences.

Also return:
- "ageYears": the child's age in years if stated or implied, else null.
- "groundedInCodex": true only if the question is genuinely about parenting / family / a child's behavior and the ladder applies. If it is off-topic, set groundedInCodex=false, set targetStep and routedStep to 0, and in each section gently say it's outside your teaching and invite a parenting, bonding, or family-management question.`;

const CoachSchema = z.object({
  targetStep: z.number(),
  routedStep: z.number(),
  routedReason: z.string(),
  doNow: z.string(),
  doLater: z.string(),
  goThink: z.string(),
  ageYears: z.number().nullable(),
  groundedInCodex: z.boolean(),
});

function formatPrinciple(p: Principle): string {
  const factors = (p.factors ?? [])
    .map((f) => `    - ${f.name}: ${f.description}`)
    .join("\n");
  const rules = (p.rules ?? [])
    .map((r) => `    - When ${r.situation}: ${r.rule}`)
    .join("\n");
  const list = (label: string, arr?: string[]) =>
    arr && arr.length ? `  ${label}:\n${arr.map((s) => `    - ${s}`).join("\n")}` : "";
  return [
    `## Rung ${p.step}: ${p.title}`,
    p.about ? `  About: ${p.about}` : "",
    factors ? `  Factors:\n${factors}` : "",
    list("Signs it IS mastered", p.masterySigns),
    list("Tells it is NOT yet learned", p.notLearnedTells),
    rules ? `  Situational rules:\n${rules}` : "",
    list("Training methods", p.trainingMethods),
  ]
    .filter(Boolean)
    .join("\n");
}

function formatEntries(entries: CodexEntry[]): string {
  if (!entries.length) return "(none)";
  return entries
    .map(
      (e) =>
        `- [Rung ${e.step}] ${e.title} (ages ${e.ageMin}-${e.ageMax})\n    Guidance: ${e.guidance}\n    Science: ${e.deepInsight}`
    )
    .join("\n");
}

function clampStep(n: number, max: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(Math.round(n), max));
}

function outsideCodex(): CoachResponse {
  return {
    doNow:
      "Listen up, that one sits outside my current teaching. Bring me a question about a parenting challenge, a bonding moment, or managing family life, and I'll guide you true.",
    doLater:
      "While you wait, think about the situation with your child you'd most like to change. A focused question earns a focused path.",
    goThink:
      "A master only teaches what they have trained. I answer from a tested codex of behavior — not guesses — so the guidance you get is grounded and safe to follow.",
    groundedInCodex: false,
    matchedCodexIds: [],
  };
}

async function attachBook(
  response: CoachResponse,
  routedStep: number
): Promise<void> {
  const principle = await getPrinciple(routedStep);
  if (!principle) return;
  response.routedPrincipleTitle = principle.title;
  if (principle.book?.title) {
    response.recommendedBook = {
      step: principle.step,
      principleTitle: principle.title,
      title: principle.book.title,
      author: principle.book.author,
      url: principle.book.purchaseUrl,
    };
  }
}

/**
 * The "artifact": diagnose the target rung, route to the lowest unlearned rung,
 * and write the three grounded sections. `currentRung` is the caller's
 * lowest-unlearned step (caps how high we can teach). Does NOT persist.
 */
export async function generateCoachResponse(
  question: string,
  currentRung: number,
  ctx?: { subjectName?: string; ageYears?: number }
): Promise<CoachResponse> {
  const [principles, entries] = await Promise.all([
    getAllPrinciples(),
    retrieveCodex(question),
  ]);

  if (principles.length === 0) {
    // No ladder authored yet — cannot ground anything.
    return outsideCodex();
  }

  const subjectLine = ctx?.subjectName
    ? `This question is about ${ctx.subjectName}${
        ctx.ageYears ? `, age ${ctx.ageYears}` : ""
      }. ${ctx.subjectName}'s CURRENT working rung is ${currentRung} (they have mastered rungs 1..${currentRung - 1}). Never teach above rung ${currentRung}.`
    : `The subject's CURRENT working rung is ${currentRung} (they have mastered rungs 1..${currentRung - 1}). Never teach above rung ${currentRung}.`;

  const result = await getAnthropic().messages.parse({
    model: COACH_MODEL,
    max_tokens: 1600,
    system: COACH_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${subjectLine}

A caregiver asks:
"""${question}"""

=== THE LADDER ===
${principles.map(formatPrinciple).join("\n\n")}

=== SUPPLEMENTARY CODEX ENTRIES (optional specifics) ===
${formatEntries(entries)}`,
      },
    ],
    output_config: { format: zodOutputFormat(CoachSchema) },
  });

  const parsed = result.parsed_output;
  if (!parsed || !parsed.groundedInCodex) {
    return outsideCodex();
  }

  const targetStep = clampStep(parsed.targetStep, TOTAL_STEPS);
  const routedStep = clampStep(
    Math.min(targetStep, currentRung),
    TOTAL_STEPS
  );

  const response: CoachResponse = {
    doNow: parsed.doNow,
    doLater: parsed.doLater,
    goThink: parsed.goThink,
    ageYears: parsed.ageYears ?? undefined,
    targetStep,
    routedStep,
    routedReason: routedStep < targetStep ? parsed.routedReason : undefined,
    subjectName: ctx?.subjectName,
    groundedInCodex: true,
    matchedCodexIds: entries
      .filter((e) => e.step === routedStep)
      .map((e) => e._id!.toString()),
  };

  await attachBook(response, routedStep);
  return response;
}

/** Production path: route by the SUBJECT's progress, generate, and persist. */
export async function runCoach(
  user: UserDoc,
  question: string,
  opts?: { subject?: SubjectDoc }
): Promise<CoachResponse> {
  const subject = opts?.subject;
  const currentRung = subject
    ? lowestUnlearnedStepOf(subject.progress)
    : lowestUnlearnedStep(user);

  const response = await generateCoachResponse(
    question,
    currentRung,
    subject
      ? { subjectName: subject.firstName, ageYears: subject.ageYears }
      : undefined
  );

  const conversations = await conversationsCollection();
  await conversations.insertOne({
    userId: user._id!.toString(),
    question,
    response,
    subjectId: subject?._id?.toString(),
    subjectName: subject?.firstName,
    routedStep: response.routedStep,
    targetStep: response.targetStep,
    createdAt: new Date(),
  });

  return response;
}
