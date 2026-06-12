"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { codexCollection, principlesCollection, usersCollection } from "@/lib/db";
import { retrieveCodex } from "@/lib/coach/codex";
import { generateCoachResponse } from "@/lib/coach/engine";
import { getPrinciple } from "@/lib/coach/principles";
import { signedBlobUrl } from "@/lib/blob";
import { beltKey } from "@/lib/taekwondo";
import type {
  CodexEntry,
  Principle,
  PrincipleFactor,
  PrincipleRule,
  Belt,
  CoachResponse,
} from "@/lib/types";

export type EntryInput = {
  _id?: string;
  title: string;
  step: number;
  principle: string;
  ageMin: number;
  ageMax: number;
  triggers: string[];
  topics: string[];
  references: string[];
  guidance: string;
  deepInsight: string;
};

export type ActionResult = { ok: boolean; id?: string; error?: string };

export async function saveEntry(input: EntryInput): Promise<ActionResult> {
  await requireAdmin();
  if (!input.title?.trim()) return { ok: false, error: "Title is required." };
  if (input.ageMin > input.ageMax) {
    return { ok: false, error: "Min age must be ≤ max age." };
  }

  const col = await codexCollection();
  const doc: Omit<CodexEntry, "_id"> = {
    title: input.title.trim(),
    step: Number(input.step) || 1,
    principle: input.principle ?? "",
    ageMin: Number(input.ageMin) || 0,
    ageMax: Number(input.ageMax) || 0,
    topics: input.topics ?? [],
    triggers: input.triggers ?? [],
    guidance: input.guidance ?? "",
    deepInsight: input.deepInsight ?? "",
    references: input.references ?? [],
  };

  let id = input._id;
  if (id) {
    await col.updateOne({ _id: new ObjectId(id) }, { $set: doc });
  } else {
    const res = await col.insertOne(doc as CodexEntry);
    id = res.insertedId.toString();
  }
  revalidatePath("/admin/codex");
  return { ok: true, id };
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  await requireAdmin();
  const col = await codexCollection();
  await col.deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/admin/codex");
  return { ok: true };
}

export type PrincipleInput = {
  step: number;
  title: string;
  about: string;
  factors: PrincipleFactor[];
  masterySigns: string[];
  notLearnedTells: string[];
  trainingMethods: string[];
  rules: PrincipleRule[];
  book: { title: string; author?: string; purchaseUrl?: string; protagonistNote?: string };
  tier: { priceCents: number; belts: Belt[] };
};

export async function savePrinciple(input: PrincipleInput): Promise<ActionResult> {
  await requireAdmin();
  const col = await principlesCollection();
  const { step, ...rest } = input;
  await col.updateOne(
    { step },
    { $set: { ...rest, step, updatedAt: new Date() } as Partial<Principle> },
    { upsert: true }
  );
  revalidatePath("/admin/principles");
  return { ok: true };
}

export type PreviewResult = {
  matched: { id: string; title: string; step: number }[];
  response: CoachResponse;
};

export async function previewCoach(
  question: string,
  currentRung: number
): Promise<PreviewResult> {
  await requireAdmin();
  const trimmed = (question || "").trim().slice(0, 1000);
  const [matchedEntries, response] = await Promise.all([
    retrieveCodex(trimmed),
    generateCoachResponse(trimmed, currentRung),
  ]);
  return {
    matched: matchedEntries.map((e) => ({
      id: e._id!.toString(),
      title: e.title,
      step: e.step,
    })),
    response,
  };
}

/** Mint a signed playback URL for a private lesson/submission video (admin). */
export async function getSignedVideoUrl(
  pathname: string
): Promise<string | null> {
  await requireAdmin();
  if (!pathname) return null;
  try {
    return await signedBlobUrl(pathname);
  } catch {
    return null;
  }
}

export type BeltSubmission = {
  userId: string;
  userName: string;
  userEmail: string;
  tier: number;
  beltIndex: number;
  submissionPathname?: string;
  submittedAt?: string;
};

export async function listBeltSubmissions(): Promise<BeltSubmission[]> {
  await requireAdmin();
  const users = await usersCollection();
  const docs = await users
    .find({ "taekwondo.beltTests": { $exists: true } })
    .toArray();

  const out: BeltSubmission[] = [];
  for (const u of docs) {
    const tests = u.taekwondo?.beltTests ?? {};
    for (const [key, t] of Object.entries(tests)) {
      if (t.status !== "submitted") continue;
      const m = key.match(/^t(\d+)b(\d+)$/);
      if (!m) continue;
      out.push({
        userId: u._id!.toString(),
        userName: u.name ?? "",
        userEmail: u.email,
        tier: Number(m[1]),
        beltIndex: Number(m[2]),
        submissionPathname: t.submissionPathname,
        submittedAt: t.submittedAt,
      });
    }
  }
  out.sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
  return out;
}

export async function reviewBeltTest(
  userId: string,
  tier: number,
  beltIndex: number,
  pass: boolean,
  note: string
): Promise<ActionResult> {
  await requireAdmin();
  const users = await usersCollection();
  const k = beltKey(tier, beltIndex);
  const set: Record<string, unknown> = {
    [`taekwondo.beltTests.${k}.status`]: pass ? "passed" : "failed",
    [`taekwondo.beltTests.${k}.reviewedAt`]: new Date().toISOString(),
    [`taekwondo.beltTests.${k}.reviewerNote`]: note ?? "",
  };

  // Passing the FINAL belt of a tier masters that principle on the ladder.
  if (pass) {
    const principle = await getPrinciple(tier);
    const lastBelt = (principle?.tier?.belts?.length ?? 0) - 1;
    if (lastBelt >= 0 && beltIndex === lastBelt) {
      set[`progress.principles.${tier}.status`] = "mastered";
      set[`progress.principles.${tier}.source`] = "taekwondo";
      set[`progress.principles.${tier}.updatedAt`] = new Date();
    }
  }

  await users.updateOne({ _id: new ObjectId(userId) }, { $set: set });
  revalidatePath("/admin/reviews");
  return { ok: true };
}
