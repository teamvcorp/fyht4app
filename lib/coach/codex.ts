import { codexCollection } from "@/lib/db";
import type { CodexEntry } from "@/lib/types";

/**
 * Keyword/age retrieval over the codex. For the MVP we score every entry in
 * memory (the codex is small); swap for vector similarity once it grows.
 * Age is optional here because we extract it from the question with Claude in
 * the same pass that writes the answer.
 */
export async function retrieveCodex(
  question: string,
  ageYears?: number
): Promise<CodexEntry[]> {
  const col = await codexCollection();
  const all = await col.find({}).limit(500).toArray();
  const q = question.toLowerCase();

  const scored = all
    .map((entry) => {
      let score = 0;
      for (const trigger of entry.triggers ?? []) {
        if (q.includes(trigger.toLowerCase())) score += 2;
      }
      for (const topic of entry.topics ?? []) {
        if (q.includes(topic.toLowerCase())) score += 1;
      }
      if (
        ageYears != null &&
        ageYears >= entry.ageMin &&
        ageYears <= entry.ageMax
      ) {
        score += 1;
      }
      return { entry, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return scored.map((s) => s.entry);
}
