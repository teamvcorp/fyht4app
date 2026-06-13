import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isAdminUser } from "@/lib/user";
import { AdminNav } from "@/components/admin/AdminNav";
import { Wordmark } from "@/components/Wordmark";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) redirect("/");

  // Mobile-first, but expands to a roomy workspace on desktop so editing
  // rules, principles, and belts isn't cramped.
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-16 pt-3 lg:max-w-5xl lg:px-8">
      <div className="flex items-center justify-between pb-3 pt-1">
        <span className="flex items-center gap-1.5">
          <Wordmark className="text-base" />
          <span className="text-base font-bold text-ink/35">Admin</span>
        </span>
        <Link href="/" className="text-xs font-semibold text-ink/60">
          ← Exit
        </Link>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
