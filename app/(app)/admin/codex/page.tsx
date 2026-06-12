import { codexCollection } from "@/lib/db";
import { getAllPrinciples } from "@/lib/coach/principles";
import { CodexList } from "@/components/admin/CodexList";

export default async function AdminCodexPage() {
  const [col, principles] = await Promise.all([
    codexCollection(),
    getAllPrinciples(),
  ]);
  const entries = await col.find({}).sort({ step: 1, title: 1 }).toArray();

  const items = entries.map((e) => ({
    id: e._id!.toString(),
    title: e.title,
    step: e.step ?? 1,
    triggers: e.triggers ?? [],
  }));
  const principleTitles: Record<number, string> = {};
  for (const p of principles) principleTitles[p.step] = p.title || `Rung ${p.step}`;

  return <CodexList items={items} principleTitles={principleTitles} />;
}
