export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight ${className}`}>
      <span className="text-ink">Black Belt</span>{" "}
      <span className="text-brand">Parenting</span>
    </span>
  );
}
