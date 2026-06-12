import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ManageBillingButton } from "@/components/ManageBillingButton";
import { logout } from "@/app/actions/session";
import { getCurrentUser, isActiveMember, isAdminUser } from "@/lib/user";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const isMember = isActiveMember(user);

  return (
    <>
      <AppHeader name={user?.name} isMember={isMember} isAdmin={isAdminUser(user)} />
      <main className="mt-4 flex flex-1 flex-col gap-5 px-4">
        <h1 className="text-2xl font-black tracking-tight text-ink">
          Account settings
        </h1>

        <div className="fyht-card p-5">
          <Row label="Name" value={user?.name || "—"} />
          <div className="my-3 h-px bg-brand/10" />
          <Row label="Email" value={user?.email || "—"} />
          <div className="my-3 h-px bg-brand/10" />
          <Row
            label="Membership"
            value={isMember ? "Active member" : "Free · 1 question/day"}
            valueClass={isMember ? "text-fyht" : "text-ink/70"}
          />
        </div>

        <div className="flex flex-col gap-3">
          {isMember ? (
            <ManageBillingButton />
          ) : (
            <Link
              href="/membership"
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3.5 font-bold text-white shadow-md transition active:scale-[0.99]"
            >
              Become a member
            </Link>
          )}
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-2xl bg-brand-50 px-5 py-3.5 font-bold text-brand transition active:scale-[0.99]"
          >
            Back to The Master
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-2xl border border-brand/15 bg-white px-5 py-3.5 font-semibold text-ink/70 shadow-sm transition active:scale-[0.99]"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function Row({
  label,
  value,
  valueClass = "text-ink/80",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-bold uppercase tracking-wide text-ink/45">
        {label}
      </span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
