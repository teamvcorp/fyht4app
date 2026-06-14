// Client-only audio engine for the Master's voice. Plays through the Web Audio
// API (resumed on a user gesture) so sound routes to the media speaker and
// bypasses the iOS hardware Silent switch far more reliably than an <audio> tag.
// Falls back to an <audio> element, then to the caller's TTS.

let ctx: AudioContext | null = null;
const bufferCache = new Map<string, AudioBuffer>();

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Call inside a user gesture (a tap) to unlock + resume audio on mobile. */
export async function unlockAudio(): Promise<void> {
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === "suspended") await c.resume();
  } catch {
    /* ignore */
  }
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

/**
 * Play an audio URL. Returns a stop() function. Tries Web Audio first (best on
 * iOS), then an <audio> element; calls onFail if neither can start.
 */
export async function playUrl(
  url: string,
  onEnd: () => void,
  onFail: () => void
): Promise<() => void> {
  const c = getCtx();
  if (c) {
    try {
      if (c.state === "suspended") await c.resume();
      let buf = bufferCache.get(url);
      if (!buf) {
        const res = await fetch(url);
        if (res.ok) {
          buf = await c.decodeAudioData(await res.arrayBuffer());
          bufferCache.set(url, buf);
        }
      }
      if (buf) {
        const src = c.createBufferSource();
        src.buffer = buf;
        const gain = c.createGain();
        gain.gain.value = 1;
        src.connect(gain).connect(c.destination);
        let ended = false;
        src.onended = () => {
          if (!ended) {
            ended = true;
            onEnd();
          }
        };
        src.start(0);
        return () => {
          try {
            src.onended = null;
            src.stop();
          } catch {
            /* ignore */
          }
        };
      }
    } catch {
      /* fall through to <audio> */
    }
  }

  // Fallback: <audio> element (subject to the iOS Silent switch).
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = 1;
  (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  audio.onended = onEnd;
  audio.onerror = onFail;
  try {
    await audio.play();
  } catch {
    onFail();
  }
  return () => {
    audio.onended = null;
    audio.onerror = null;
    try {
      audio.pause();
    } catch {
      /* ignore */
    }
  };
}
