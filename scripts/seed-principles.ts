/**
 * Bootstraps the 5 Guiding Principle shells (steps 1-5) with structural
 * scaffolding only — belts + tier price. The confidential content (title,
 * about, factors, mastery signs, tells, rules, training, book) is authored by
 * the owner in /admin/principles. Non-destructive: uses $setOnInsert so it
 * never overwrites authored content. Run:  npm run seed:principles
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import type { Principle, Belt } from "../lib/types";

function loadEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* rely on real env */
  }
}

function belts(names: string[]): Belt[] {
  return names.map((name) => ({
    name,
    lessons: Array.from({ length: 4 }, () => ({ name: "", focus: "" })),
  }));
}

const SCAFFOLD: Array<Pick<Principle, "step"> & {
  priceCents: number;
  beltNames: string[];
}> = [
  { step: 1, priceCents: 90000, beltNames: ["White", "Yellow", "Orange"] },
  { step: 2, priceCents: 120000, beltNames: ["Green", "Purple", "Light Blue"] },
  { step: 3, priceCents: 150000, beltNames: ["Dark Blue", "Brown", "Red"] },
  { step: 4, priceCents: 180000, beltNames: ["Deputy Black Belt"] },
  { step: 5, priceCents: 210000, beltNames: ["Black Belt"] },
];

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set (check .env.local).");
  const dbName = process.env.MONGODB_DB || "fyht4";

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const principles = db.collection<Principle>("principles");

  for (const s of SCAFFOLD) {
    await principles.updateOne(
      { step: s.step },
      {
        $setOnInsert: {
          step: s.step,
          title: "",
          about: "",
          factors: [],
          masterySigns: [],
          notLearnedTells: [],
          trainingMethods: [],
          rules: [],
          book: { title: "" },
          tier: { priceCents: s.priceCents, belts: belts(s.beltNames) },
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  // Backfill: any codex entry missing a step belongs to rung 1 until reassigned.
  const codex = db.collection("codexEntries");
  const res = await codex.updateMany(
    { step: { $exists: false } },
    { $set: { step: 1 } }
  );

  const count = await principles.countDocuments();
  console.log(
    `Principles ready: ${count} shells. Backfilled ${res.modifiedCount} codex entries to step 1.`
  );
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
