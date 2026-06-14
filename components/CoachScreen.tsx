"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Character } from "@/components/Character";
import { CoachResponse } from "@/components/CoachResponse";
import { UpgradeGate } from "@/components/UpgradeGate";
import { MicButton } from "@/components/MicButton";
import { SubjectPicker } from "@/components/SubjectPicker";
import { NudgeCard } from "@/components/NudgeCard";
import { useSpeechInput } from "@/components/useSpeechInput";
import { askCoach, type Nudge } from "@/app/actions/coach";
import type { SubjectView } from "@/app/actions/subjects";
import type { CoachResponse as CoachResponseType } from "@/lib/types";

export function CoachScreen({
  isMember,
  dailyLimit,
  subjects,
  advice = [],
}: {
  isMember: boolean;
  dailyLimit: number;
  subjects: SubjectView[];
  advice?: { text: string; audioUrl?: string }[];
}) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectView | null>(
    subjects.length === 1 ? subjects[0] : null
  );
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<CoachResponseType | null>(null);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [gated, setGated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Idle "random advice" speech.
  const [adviceText, setAdviceText] = useState<string | null>(null);
  const [speakingAdvice, setSpeakingAdvice] = useState(false);
  const adviceAudioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);
  const liveRef = useRef({
    pending: false,
    response: false,
    gated: false,
    listening: false,
  });

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
      stopAdvice();
      speechBaseRef.current = question.trim();
      setError(null);
      start();
    }
  }

  // Keep latest "busy" flags readable inside the scheduler/handlers.
  liveRef.current = { pending, response: !!response, gated, listening };

  function speakTTS(text: string, onend: () => void) {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return onend();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.onend = onend;
      u.onerror = onend;
      synth.cancel();
      synth.speak(u);
    } catch {
      onend();
    }
  }

  function stopAdvice() {
    setSpeakingAdvice(false);
    setAdviceText(null);
    playingRef.current = false;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    const a = adviceAudioRef.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      try {
        a.pause();
      } catch {
        /* ignore */
      }
      adviceAudioRef.current = null;
    }
  }

  // Speak one random advice line. `onDemand` (tap) bypasses the idle check.
  const playRandomAdvice = useCallback(
    (onDemand = false) => {
      if (!advice.length || playingRef.current) return;
      if (!onDemand) {
        const s = liveRef.current;
        if (s.pending || s.response || s.gated || s.listening) return;
      }
      const pick = advice[Math.floor(Math.random() * advice.length)];
      playingRef.current = true;
      setAdviceText(pick.text);
      setSpeakingAdvice(true);

      let ended = false;
      const done = () => {
        if (ended) return;
        ended = true;
        clearTimeout(guard);
        playingRef.current = false;
        setSpeakingAdvice(false);
        setAdviceText(null);
        adviceAudioRef.current = null;
      };
      const guard = setTimeout(done, 12000);

      if (pick.audioUrl) {
        const audio = new Audio(pick.audioUrl);
        adviceAudioRef.current = audio;
        audio.onended = done;
        audio.onerror = () => speakTTS(pick.text, done);
        audio.play().catch(() => speakTTS(pick.text, done));
      } else {
        speakTTS(pick.text, done);
      }
    },
    [advice]
  );

  const playRef = useRef(playRandomAdvice);
  playRef.current = playRandomAdvice;

  // Browsers block autoplay until the first user gesture. Unlock on the first
  // interaction, then speak a random line periodically while idle.
  useEffect(() => {
    if (!advice.length) return;
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      playRef.current(false);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    const id = setInterval(() => {
      if (unlocked) playRef.current(false);
    }, 22000);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      clearInterval(id);
    };
  }, [advice.length]);

  function submit(q?: string) {
    const text = (q ?? question).trim();
    if (!text || pending) return;
    if (!selectedSubject) {
      setError("Pick who this is about first.");
      return;
    }
    if (listening) stop();
    stopAdvice();
    setQuestion(text);
    setError(null);
    setGated(false);
    setNudge(null);
    startTransition(async () => {
      const result = await askCoach(text, selectedSubject.id);
      if (result.ok) {
        setResponse(result.response);
        setNudge(result.nudge ?? null);
      } else if (result.reason === "no_subject") {
        setError("Pick who this is about first.");
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

  const characterState = pending
    ? "thinking"
    : response || speakingAdvice
      ? "speaking"
      : "idle";

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={() => playRandomAdvice(true)}
        aria-label="Tap to hear the Master"
        title="Tap to hear the Master"
        className="rounded-full outline-none"
      >
        <Character state={characterState} />
      </button>

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
              : adviceText
                ? adviceText
                : "What challenge are we solving today?"}
        </p>
      </div>

      {advice.length > 0 && !response && !pending && (
        <p className="-mt-2 text-[11px] font-medium text-brand/70">
          🔊 Tap the Master to hear him
        </p>
      )}

      <SubjectPicker
        initialSubjects={subjects}
        selectedId={selectedSubject?.id ?? null}
        onSelect={setSelectedSubject}
      />

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
              disabled={!selectedSubject}
              placeholder={
                !selectedSubject
                  ? "Pick who this is about first…"
                  : listening
                    ? "Listening… speak your question"
                    : `Ask about ${selectedSubject.firstName}…`
              }
              className={`w-full resize-none rounded-2xl bg-brand-50/60 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink/40 focus:bg-brand-50 disabled:opacity-60 ${
                micSupported ? "pr-14" : ""
              }`}
            />
            {micSupported && selectedSubject && (
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
            disabled={pending || !question.trim() || !selectedSubject}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
          >
            {pending ? "Consulting the codex…" : "Ask The Master"}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-ink/45">
          {selectedSubject ? `About ${selectedSubject.firstName} · ` : ""}
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
        {nudge && (
          <div className="mt-4">
            <NudgeCard
              step={nudge.step}
              principleTitle={nudge.principleTitle}
              count={nudge.count}
              subjectName={selectedSubject?.firstName}
            />
          </div>
        )}
      </div>

      {(response || gated) && !pending && (
        <button
          type="button"
          onClick={() => {
            setResponse(null);
            setNudge(null);
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
