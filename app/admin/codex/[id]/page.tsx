import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { codexCollection } from "@/lib/db";
import { getAllPrinciples } from "@/lib/coach/principles";
import { EntryForm } from "@/components/admin/EntryForm";
import type { EntryInput } from "@/app/actions/admin";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let _id: ObjectId;
  try {
    _id = new ObjectId(id);
  } catch {
    notFound();
  }

  const [col, principles] = await Promise.all([
    codexCollection(),
    getAllPrinciples(),
  ]);
  const doc = await col.findOne({ _id });
  if (!doc) notFound();

  const entry: EntryInput = {
    _id: doc._id!.toString(),
    title: doc.title,
    step: doc.step ?? 1,
    principle: doc.principle ?? "",
    ageMin: doc.ageMin ?? 0,
    ageMax: doc.ageMax ?? 0,
    triggers: doc.triggers ?? [],
    topics: doc.topics ?? [],
    references: doc.references ?? [],
    guidance: doc.guidance ?? "",
    deepInsight: doc.deepInsight ?? "",
  };

  return (
    <div className="flex flex-col gap-4 lg:max-w-2xl">
      <h1 className="text-xl font-black text-ink">Edit entry</h1>
      <EntryForm
        entry={entry}
        principles={principles.map((p) => ({ step: p.step, title: p.title }))}
      />
    </div>
  );
}
