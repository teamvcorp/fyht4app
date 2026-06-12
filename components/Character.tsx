import Image from "next/image";

/**
 * The talking character slot (top-center). Currently a static portrait
 * (public/master.png). This component isolates the slot so swapping in a Rive
 * animation later (@rive-app/react-canvas) is a one-file change — keep the
 * outer wrapper + glow and replace the <Image> with the <Rive> canvas.
 */
export function Character({ state = "idle" }: { state?: "idle" | "thinking" | "speaking" }) {
  return (
    <div className="relative flex flex-col items-center select-none">
      {/* glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-4 h-36 w-36 rounded-full bg-brand/25 blur-3xl"
      />
      <Image
        src="/master.png"
        alt="The Master, your family coach"
        width={300}
        height={420}
        priority
        className={`relative h-auto w-[132px] sm:w-[160px] drop-shadow-[0_18px_24px_rgba(109,40,217,0.25)] ${
          state === "speaking" || state === "idle" ? "animate-float" : ""
        }`}
      />
      {state === "thinking" && (
        <div className="mt-1 flex gap-1.5" aria-label="The Master is thinking">
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand" />
        </div>
      )}
    </div>
  );
}
