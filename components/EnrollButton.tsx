"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { enrollTier } from "@/app/actions/taekwondo";

export function EnrollButton({
  tier,
  priceDollars,
}: {
  tier: number;
  priceDollars: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await enrollTier(tier);
          router.refresh();
        })
      }
      className="w-full rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3.5 font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
    >
      {pending
        ? "Enrolling…"
        : `Enroll in Tier ${tier}${priceDollars ? ` · $${priceDollars.toLocaleString()}` : ""}`}
    </button>
  );
}
