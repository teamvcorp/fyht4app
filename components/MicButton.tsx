"use client";

export function MicButton({
  listening,
  onClick,
  className = "",
}: {
  listening: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={listening ? "Stop voice input" : "Speak your question"}
      aria-pressed={listening}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition active:scale-90 ${
        listening
          ? "bg-donow text-white"
          : "bg-brand-50 text-brand hover:opacity-90"
      } ${className}`}
    >
      {listening && (
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full bg-donow/40"
        />
      )}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        className="relative h-5 w-5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
      </svg>
    </button>
  );
}
