"use client";

import { useEffect, useRef } from "react";

type CharState = "idle" | "thinking" | "speaking";

// Frame ranges [start, end] derived from the capybara.json markers.
const SEG = {
  idle: [0, 120],
  blink: [120, 138],
  talk: [138, 168],
  happy: [168, 216],
  sad: [216, 264],
  think: [264, 312],
  bow: [312, 378],
} as const;

const STATE_SEG: Record<CharState, keyof typeof SEG> = {
  idle: "idle",
  thinking: "think",
  speaking: "talk",
};

/**
 * The talking Master — a rigged Lottie capybara sensei (public/capybara.json).
 * Loops the segment that matches the current state: idle / think / talk.
 */
export function Character({ state = "idle" }: { state?: CharState }) {
  const boxRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animRef = useRef<any>(null);
  const loopRef = useRef<keyof typeof SEG>("idle");

  useEffect(() => {
    let destroyed = false;
    let onComplete: (() => void) | null = null;

    (async () => {
      const lottie = (await import("lottie-web")).default;
      if (destroyed || !boxRef.current) return;
      const a = lottie.loadAnimation({
        container: boxRef.current,
        renderer: "svg",
        loop: false,
        autoplay: false,
        path: "/capybara.json",
      });
      animRef.current = a;
      // Re-trigger the active segment each time it finishes → seamless loop.
      onComplete = () => {
        const seg = SEG[loopRef.current];
        if (seg) a.playSegments([seg[0], seg[1]], true);
      };
      a.addEventListener("complete", onComplete);
      a.addEventListener("DOMLoaded", () => {
        const seg = SEG[loopRef.current];
        a.playSegments([seg[0], seg[1]], true);
      });
    })();

    return () => {
      destroyed = true;
      const a = animRef.current;
      if (a) {
        if (onComplete) a.removeEventListener("complete", onComplete);
        a.destroy();
      }
      animRef.current = null;
    };
  }, []);

  // Switch loops when the state changes.
  useEffect(() => {
    const key = STATE_SEG[state];
    loopRef.current = key;
    const a = animRef.current;
    if (a) {
      const seg = SEG[key];
      a.playSegments([seg[0], seg[1]], true);
    }
  }, [state]);

  return (
    <div className="relative flex select-none flex-col items-center">
      <div
        aria-hidden
        className="pointer-events-none absolute top-4 h-36 w-36 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        ref={boxRef}
        role="img"
        aria-label="The Master, your family coach"
        className="relative aspect-[680/940] w-[150px] drop-shadow-[0_18px_24px_rgba(109,40,217,0.25)] sm:w-[172px]"
      />
    </div>
  );
}
