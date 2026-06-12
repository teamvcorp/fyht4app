import Link from "next/link";
import { logout } from "@/app/actions/session";
import { Wordmark } from "@/components/Wordmark";

export function AppHeader({
  name,
  isMember,
  isAdmin = false,
}: {
  name?: string | null;
  isMember: boolean;
  isAdmin?: boolean;
}) {
  return (
    <header className="flex items-center justify-between px-4 pb-2 pt-1">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="Black Belt Parenting home">
          <Wordmark className="text-[15px] sm:text-lg" />
        </Link>
        {isMember && (
          <span className="rounded-full bg-fyht/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fyht">
            Member
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link
            href="/admin/principles"
            className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand transition active:scale-95"
          >
            Admin
          </Link>
        )}
        {name && (
          <span className="hidden text-sm text-ink/60 sm:inline">{name}</span>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-brand/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 shadow-sm transition active:scale-95"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
