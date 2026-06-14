"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin";
import { masterAdviceCollection } from "@/lib/db";
import { synthesizeSpeech } from "@/lib/elevenlabs";

export type AdviceView = {
  id: string;
  text: string;
  audioUrl?: string;
  audioPathname?: string;
  enabled: boolean;
};

export type AdviceInput = {
  id?: string;
  text: string;
  audioUrl?: string;
  audioPathname?: string;
  enabled: boolean;
};

export async function listAdvice(): Promise<AdviceView[]> {
  await requireAdmin();
  const col = await masterAdviceCollection();
  const docs = await col.find({}).sort({ createdAt: 1 }).toArray();
  return docs.map((d) => ({
    id: d._id!.toString(),
    text: d.text,
    audioUrl: d.audioUrl,
    audioPathname: d.audioPathname,
    enabled: d.enabled,
  }));
}

export async function saveAdvice(
  input: AdviceInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  await requireAdmin();
  const text = (input.text || "").trim().slice(0, 280);
  if (!text) return { ok: false, error: "Write the advice line first." };

  const col = await masterAdviceCollection();
  const fields = {
    text,
    audioUrl: input.audioUrl,
    audioPathname: input.audioPathname,
    enabled: input.enabled,
  };

  if (input.id) {
    await col.updateOne({ _id: new ObjectId(input.id) }, { $set: fields });
    revalidatePath("/admin/master");
    revalidatePath("/");
    return { ok: true, id: input.id };
  }

  const res = await col.insertOne({ ...fields, createdAt: new Date() });
  revalidatePath("/admin/master");
  revalidatePath("/");
  return { ok: true, id: res.insertedId.toString() };
}

/** Generate the Master's voice (ElevenLabs) for a saved line, store as a public blob. */
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
    const blob = await put(`advice/voice-${id}-${Date.now()}.mp3`, audio, {
      access: "public",
      contentType: "audio/mpeg",
    });
    // Clean up the previous clip.
    if (doc.audioPathname) {
      try {
        await del(doc.audioPathname);
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
    return { ok: true, audioUrl: blob.url };
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
  await col.deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/admin/master");
  revalidatePath("/");
}

/** Public: enabled advice lines for the landing (no auth). */
export async function getActiveAdvice(): Promise<
  { text: string; audioUrl?: string }[]
> {
  const col = await masterAdviceCollection();
  const docs = await col.find({ enabled: true }).toArray();
  return docs.map((d) => ({ text: d.text, audioUrl: d.audioUrl }));
}
