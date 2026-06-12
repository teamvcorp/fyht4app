"use client";

import { useRef, useState, useTransition } from "react";
import { Character } from "@/components/Character";
import { CoachResponse } from "@/components/CoachResponse";
import { UpgradeGate } from "@/components/UpgradeGate";
import { MicButton } from "@/components/MicButton";
import { useSpeechInput } from "@/components/useSpeechInput";
import { askCoach } from "@/app/actions/coach";
import type { CoachResponse as CoachResponseType } from "@/lib/types";

export function CoachScreen({
  isMember,
  dailyLimit,
}: {
  isMember: boolean;
  dailyLimit: number;
}) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<CoachResponseType | null>(null);
  const [gated, setGated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Voice dictation appends to whatever was typed before the mic was tapped.
  const speechBaseRef = useRef("");
  const { supported: micSupported, listening, start, stop } = useSpeechInput(
    (transcript) => {
      const base = speechBaseRef.current;
      setQuestion(((base ? base + " " : "") + transcript).slice(0, 1000));
    }
  );

  function toggleMic() {
    if (listening) {
      stop();
    } else {
      speechBaseRef.current = question.trim();
      setError(null);
      start();
    }
  }

  function submit(q?: string) {
    const text = (q ?? question).trim();
    if (!text || pending) return;
    if (listening) stop();
    setQuestion(text);
    setError(null);
    setGated(false);
    startTransition(async () => {
      const result = await askCoach(text);
      if (result.ok) {
        setResponse(result.response);
      } else if (result.reason === "quota") {
        setResponse(null);
        if (isMember) {
          setError(
            `You've used today's ${dailyLimit} coaching questions — come back tomorrow.`
          );
        } else {
          setGated(true);
        }
      } else if (result.reason === "empty") {
        setError("Ask The Master a question first.");
      } else if (result.reason === "error") {
        setError("The Master is resting (the coaching service isn't reachable). Try again shortly.");
      } else {
        setError("Your session expired — please sign in again.");
      }
    });
  }

  const characterState = pending ? "thinking" : response ? "speaking" : "idle";

  return (
    <div className="flex flex-col items-center gap-5">
      <Character state={characterState} />

      {/* speech bubble */}
      <div className="relative max-w-[19rem] rounded-3xl bg-white px-5 py-3 text-center shadow-[0_8px_20px_-10px_rgba(109,40,217,0.35)]">
        <span
          aria-hidden
          className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white"
        />
        <p className="relative text-sm font-medium text-ink/80">
          {pending
            ? "Let me think on that…"
            : response
              ? "Here is your path. Walk it."
              : "What challenge are we solving today?"}
        </p>
      </div>

      {/* input */}
      <form
        className="w-full"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="fyht-card p-3">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={3}
              maxLength={1000}
              placeholder={
                listening
                  ? "Listening… speak your question"
                  : "Ask about a parenting challenge, a bonding idea, or family life…"
              }
              className={`w-full resize-none rounded-2xl bg-brand-50/60 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink/40 focus:bg-brand-50 ${
                micSupported ? "pr-14" : ""
              }`}
            />
            {micSupported && (
              <MicButton
                listening={listening}
                onClick={toggleMic}
                className="absolute bottom-2 right-2"
              />
            )}
          </div>
          {listening && (
            <p className="mt-1.5 text-center text-xs font-medium text-donow">
              ● Listening… tap the mic again when you&apos;re done
            </p>
          )}
          <button
            type="submit"
            disabled={pending || !question.trim()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
          >
            {pending ? "Consulting the codex…" : "Ask The Master"}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-ink/45">
          {isMember
            ? `Member · up to ${dailyLimit} questions/day`
            : "Free · 1 question per day"}
        </p>
      </form>

      {error && (
        <p className="text-center text-sm font-medium text-donow">{error}</p>
      )}

      <div className="w-full">
        {gated && <UpgradeGate />}
        {response && <CoachResponse response={response} />}
      </div>

      {(response || gated) && !pending && (
        <button
          type="button"
          onClick={() => {
            setResponse(null);
            setGated(false);
            setQuestion("");
            setError(null);
          }}
          className="text-sm font-semibold text-brand"
        >
          Ask another question
        </button>
      )}
    </div>
  );
}
