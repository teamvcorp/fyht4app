/**
 * ElevenLabs text-to-speech. Used to pre-generate the Master's voice for each
 * advice line (generated once, stored as a public blob — no per-play cost).
 */
export function elevenConfigured(): boolean {
  return !!process.env.ELEVEN_API_KEY;
}

let cachedVoiceId: string | null = null;

/**
 * Resolve the voice id. Prefers ELEVEN_VOICE_ID; otherwise looks up a voice by
 * name (ELEVEN_VOICE_NAME, default "master") in the account's voice library.
 */
async function resolveVoiceId(key: string): Promise<string> {
  if (process.env.ELEVEN_VOICE_ID) return process.env.ELEVEN_VOICE_ID;
  if (cachedVoiceId) return cachedVoiceId;

  const want = (process.env.ELEVEN_VOICE_NAME || "master").toLowerCase();
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  });
  if (!res.ok) throw new Error(`ElevenLabs voices ${res.status}`);
  const data = (await res.json()) as { voices?: { voice_id: string; name?: string }[] };
  const voices = data.voices ?? [];
  const match =
    voices.find((v) => (v.name ?? "").toLowerCase() === want) ??
    voices.find((v) => (v.name ?? "").toLowerCase().includes(want));
  if (!match) {
    throw new Error(
      `No ElevenLabs voice named "${want}". Set ELEVEN_VOICE_ID in env.`
    );
  }
  cachedVoiceId = match.voice_id;
  return cachedVoiceId;
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const key = process.env.ELEVEN_API_KEY;
  if (!key) throw new Error("ELEVEN_API_KEY is not set.");

  const voiceId = await resolveVoiceId(key);
  const modelId = process.env.ELEVEN_MODEL || "eleven_turbo_v2_5";

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 200)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
