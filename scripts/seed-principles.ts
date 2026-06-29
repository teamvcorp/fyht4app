/**
 * Bootstraps the 5 Guiding Principle shells (steps 1-5). The confidential
 * content (title, about, factors, mastery signs, tells, rules, training, book)
 * is authored by the owner in /admin/principles. Non-destructive: uses
 * $setOnInsert so it never overwrites authored content. Run: npm run seed:principles
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import type { Principle } from "../lib/types";

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

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set (check .env.local).");
  const dbName = process.env.MONGODB_DB || "fyht4";

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const principles = db.collection<Principle>("principles");

  for (const step of [1, 2, 3, 4, 5]) {
    await principles.updateOne(
      { step },
      {
        $setOnInsert: {
          step,
          title: "",
          about: "",
          factors: [],
          masterySigns: [],
          notLearnedTells: [],
          trainingMethods: [],
          rules: [],
          book: { title: "" },
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
