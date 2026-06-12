import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FooterNav } from "@/components/FooterNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pb-36 pt-3">
        {children}
      </div>
      <FooterNav />
    </>
  );
}
