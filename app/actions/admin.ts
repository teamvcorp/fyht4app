"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { codexCollection, principlesCollection } from "@/lib/db";
import { retrieveCodex } from "@/lib/coach/codex";
import { generateCoachResponse } from "@/lib/coach/engine";
import type {
  CodexEntry,
  Principle,
  PrincipleFactor,
  PrincipleRule,
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

