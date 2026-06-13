import { getAllPrinciples } from "@/lib/coach/principles";
import { EntryForm } from "@/components/admin/EntryForm";

export default async function NewEntryPage() {
  const principles = await getAllPrinciples();
  return (
    <div className="flex flex-col gap-4 lg:max-w-2xl">
      <h1 className="text-xl font-black text-ink">New codex entry</h1>
      <EntryForm
        principles={principles.map((p) => ({
          step: p.step,
          title: p.title,
        }))}
      />
    </div>
  );
}
