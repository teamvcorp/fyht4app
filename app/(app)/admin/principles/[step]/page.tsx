import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrinciple } from "@/lib/coach/principles";
import { PrincipleForm } from "@/components/admin/PrincipleForm";
import type { Principle } from "@/lib/types";

function emptyPrinciple(step: number): Principle {
  return {
    step,
    title: "",
    about: "",
    factors: [],
    masterySigns: [],
    notLearnedTells: [],
    trainingMethods: [],
    rules: [],
    book: { title: "" },
    tier: { priceCents: 0, belts: [] },
  };
}

export default async function EditPrinciplePage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: stepStr } = await params;
  const step = Number(stepStr);
  if (!Number.isInteger(step) || step < 1 || step > 5) notFound();

  const existing = await getPrinciple(step);
  const principle = existing ?? emptyPrinciple(step);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-ink">Rung {step}</h1>
        <Link href="/admin/principles" className="text-xs font-semibold text-brand">
          ← All rungs
        </Link>
      </div>
      <PrincipleForm
        principle={{
          step: principle.step,
          title: principle.title,
          about: principle.about,
          factors: principle.factors ?? [],
          masterySigns: principle.masterySigns ?? [],
          notLearnedTells: principle.notLearnedTells ?? [],
          trainingMethods: principle.trainingMethods ?? [],
          rules: principle.rules ?? [],
          book: principle.book ?? { title: "" },
          tier: principle.tier ?? { priceCents: 0, belts: [] },
        }}
      />
    </div>
  );
}
