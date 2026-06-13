"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/user";
import { subjectsCollection } from "@/lib/db";
import {
  getSubject,
  canVerifySubjectRung,
  setSubjectStatus,
  setSubjectFactorValue,
} from "@/lib/subjects";
import type { SubjectDoc } from "@/lib/types";

export type SubjectView = { id: string; firstName: string; ageYears: number };

export async function addSubject(
  firstName: string,
  ageYears: number
): Promise<{ ok: boolean; subject?: SubjectView; error?: string }> {
  const user = await getCurrentUser();
  if (!user?._id) return { ok: false, error: "Not signed in." };

  const name = (firstName || "").trim().slice(0, 40);
  const age = Math.round(Number(ageYears));
  if (!name) return { ok: false, error: "First name is required." };
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    return { ok: false, error: "Enter a valid age." };
  }

  const col = await subjectsCollection();
  const res = await col.insertOne({
    userId: user._id.toString(),
    firstName: name,
    ageYears: age,
    createdAt: new Date(),
  } as SubjectDoc);

  revalidatePath("/");
  revalidatePath("/journey");
  return {
    ok: true,
    subject: { id: res.insertedId.toString(), firstName: name, ageYears: age },
  };
}

export async function setSubjectMastered(
  subjectId: string,
  step: number,
  mastered: boolean
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user?._id) return { ok: false, error: "Not signed in." };

  const subject = await getSubject(user._id.toString(), subjectId);
  if (!subject) return { ok: false, error: "Subject not found." };

  if (mastered && !(await canVerifySubjectRung(user, step))) {
    return {
      ok: false,
      error:
        "Read this tier's book or complete its Taekwondo to verify mastery.",
    };
  }

  await setSubjectStatus(
    user._id.toString(),
    subjectId,
    step,
    mastered ? "mastered" : "learning"
  );
  revalidatePath(`/journey/${subjectId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function setSubjectFactor(
  subjectId: string,
  step: number,
  factor: string,
  value: boolean
): Promise<void> {
  const user = await getCurrentUser();
  if (!user?._id) return;
  const subject = await getSubject(user._id.toString(), subjectId);
  if (!subject) return;
  await setSubjectFactorValue(user._id.toString(), subjectId, step, factor, value);
  revalidatePath(`/journey/${subjectId}`);
}
