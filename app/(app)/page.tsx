import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { CoachScreen } from "@/components/CoachScreen";
import { getCurrentUser, isActiveMember, isAdminUser } from "@/lib/user";
import { dailyLimit } from "@/lib/quota";
import { listSubjects } from "@/lib/subjects";

export default async function HomePage() {
  const user = await getCurrentUser();
  const isMember = isActiveMember(user);

  const subjectDocs = user?._id
    ? await listSubjects(user._id.toString())
    : [];
  const subjects = subjectDocs.map((s) => ({
    id: s._id!.toString(),
    firstName: s.firstName,
    ageYears: s.ageYears,
  }));

  return (
    <>
      <AppHeader name={user?.name} isMember={isMember} isAdmin={isAdminUser(user)} />
      <main className="mt-3 flex-1">
        {subjects.length > 0 && (
          <Link
            href="/journey"
            className="mx-4 mb-1 flex items-center justify-between rounded-full bg-white px-4 py-2 text-xs shadow-sm ring-1 ring-brand/10"
          >
            <span className="font-bold text-brand">
              {subjects.length} {subjects.length === 1 ? "journey" : "journeys"}
            </span>
            <span className="text-ink/45">Track progress →</span>
          </Link>
        )}
        <CoachScreen
          isMember={isMember}
          dailyLimit={dailyLimit(user)}
          subjects={subjects}
        />
      </main>
    </>
  );
}
