"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { masterAdviceCollection } from "@/lib/db";
import { synthesizeSpeech } from "@/lib/elevenlabs";
import { uploadPrivate, signedBlobUrl, deleteBlob } from "@/lib/blob";

export type AdviceView = {
  id: string;
  text: string;
  /** Short-lived signed URL for playback (the store is private). */
  audioUrl?: string;
  enabled: boolean;
};

export type AdviceInput = {
  id?: string;
  text: string;
  enabled: boolean;
};

async function signedFor(pathname?: string): Promise<string | undefined> {
  if (!pathname) return undefined;
  try {
    return await signedBlobUrl(pathname);
  } catch {
    return undefined;
  }
}

export async function listAdvice(): Promise<AdviceView[]> {
  await requireAdmin();
  const col = await masterAdviceCollection();
  const docs = await col.find({}).sort({ createdAt: 1 }).toArray();
  return Promise.all(
    docs.map(async (d) => ({
      id: d._id!.toString(),
      text: d.text,
      audioUrl: await signedFor(d.audioPathname),
      enabled: d.enabled,
    }))
  );
}

export async function saveAdvice(
  input: AdviceInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  await requireAdmin();
  const text = (input.text || "").trim().slice(0, 280);
  if (!text) return { ok: false, error: "Write the advice line first." };

  const col = await masterAdviceCollection();

  if (input.id) {
    await col.updateOne(
      { _id: new ObjectId(input.id) },
      { $set: { text, enabled: input.enabled } }
    );
    revalidatePath("/admin/master");
    revalidatePath("/");
    return { ok: true, id: input.id };
  }

  const res = await col.insertOne({
    text,
    enabled: input.enabled,
    createdAt: new Date(),
  });
  revalidatePath("/admin/master");
  revalidatePath("/");
  return { ok: true, id: res.insertedId.toString() };
}

/** Generate the Master's voice (ElevenLabs) for a saved line; store privately. */
export async function generateAdviceVoice(
  id: string
): Promise<{ ok: boolean; audioUrl?: string; error?: string }> {
  await requireAdmin();
  if (!process.env.ELEVEN_API_KEY) {
    return { ok: false, error: "ElevenLabs isn't configured (ELEVEN_API_KEY)." };
  }

  const col = await masterAdviceCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (!doc) return { ok: false, error: "Advice not found." };
  if (!doc.text.trim()) return { ok: false, error: "Add the text first." };

  try {
    const audio = await synthesizeSpeech(doc.text);
    const blob = await uploadPrivate(
      `advice/voice-${id}.mp3`,
      audio,
      "audio/mpeg"
    );
    // Clean up the previous clip.
    if (doc.audioUrl) {
      try {
        await deleteBlob(doc.audioUrl);
      } catch {
        /* ignore */
      }
    }
    await col.updateOne(
      { _id: doc._id },
      { $set: { audioUrl: blob.url, audioPathname: blob.pathname } }
    );
    revalidatePath("/admin/master");
    revalidatePath("/");
    return { ok: true, audioUrl: await signedFor(blob.pathname) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Voice generation failed.",
    };
  }
}

export async function deleteAdvice(id: string): Promise<void> {
  await requireAdmin();
  const col = await masterAdviceCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (doc?.audioUrl) {
    try {
      await deleteBlob(doc.audioUrl);
    } catch {
      /* ignore */
    }
  }
  await col.deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/admin/master");
  revalidatePath("/");
}

/** Public: enabled advice lines for the landing (signed playback URLs). */
export async function getActiveAdvice(): Promise<
  { text: string; audioUrl?: string }[]
> {
  const col = await masterAdviceCollection();
  const docs = await col.find({ enabled: true }).toArray();
  return Promise.all(
    docs.map(async (d) => ({
      text: d.text,
      audioUrl: await signedFor(d.audioPathname),
    }))
  );
}
