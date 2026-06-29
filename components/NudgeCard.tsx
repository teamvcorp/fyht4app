import { BuyBookButton } from "@/components/BuyBookButton";

export function NudgeCard({
  step,
  principleTitle,
  count,
  subjectName,
}: {
  step: number;
  principleTitle: string;
  count: number;
  subjectName?: string;
}) {
  return (
    <div className="fyht-card w-full animate-pop overflow-hidden ring-1 ring-donow/20">
      <div className="h-1.5 w-full bg-donow" />
      <div className="p-4">
        <p className="text-sm font-bold text-ink">
          {subjectName ? `${subjectName} keeps` : "This keeps"} landing on{" "}
          {principleTitle}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">
          {count} times lately. The Master recommends mastering this rung — read
          the book to lock it in.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <BuyBookButton tier={step} />
        </div>
      </div>
    </div>
  );
}
