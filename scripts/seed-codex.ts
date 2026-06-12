/**
 * Seeds a few starter behavioral codex entries. These are intentionally small —
 * we'll grow the real codex together. Run with:
 *   npx tsx scripts/seed-codex.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import type { CodexEntry } from "../lib/types";

// Minimal .env.local loader so the script runs standalone.
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
    /* no .env.local — rely on real env */
  }
}

const ENTRIES: Omit<CodexEntry, "_id">[] = [
  {
    title: "Name the feeling before correcting the behavior",
    step: 1,
    principle:
      "A child who feels understood can be redirected; a child who feels attacked digs in.",
    ageMin: 2,
    ageMax: 7,
    topics: ["emotional-regulation", "tantrums", "discipline"],
    triggers: ["tantrum", "meltdown", "crying", "screaming", "upset", "angry", "frustrated"],
    guidance:
      "Get to their eye level, calmly name what they feel ('You're furious the screen went off'), then state the limit and one acceptable choice. Stay quiet and present until the wave passes — do not lecture mid-storm.",
    deepInsight:
      "Naming an emotion engages the prefrontal cortex and dampens the amygdala's threat response ('name it to tame it'). Co-regulation from a calm adult literally lends the child a nervous system until theirs can self-soothe.",
  },
  {
    title: "Hitting gets a calm, immediate, physical boundary",
    step: 1,
    principle:
      "Young children stop a behavior they cannot successfully repeat, not one they are merely told is wrong.",
    ageMin: 2,
    ageMax: 6,
    topics: ["discipline", "aggression", "emotional-regulation"],
    triggers: ["hit", "hitting", "hits", "bite", "biting", "kick", "throw", "aggressive"],
    guidance:
      "Calmly catch the hand and say 'I won't let you hit.' Move yourself or them so it can't continue, then offer the words they lacked: 'Say I'm mad.' Reconnect once calm. Avoid hitting back or big angry reactions, which teach that big feelings mean big force.",
    deepInsight:
      "Toddler aggression is an immature brain hitting a wall between a big impulse and few words. Blocking the act (not shaming the child) plus supplying language builds the neural bridge from impulse to expression over hundreds of repetitions.",
  },
  {
    title: "Bedtime resistance yields to a predictable, boring routine",
    step: 1,
    principle:
      "Predictability is sleep's strongest cue; novelty and negotiation are its enemies.",
    ageMin: 1,
    ageMax: 10,
    topics: ["sleep", "routines", "bedtime"],
    triggers: ["bedtime", "sleep", "won't sleep", "stay up", "night", "wake up", "nap"],
    guidance:
      "Run the same short sequence in the same order every night (bath, teeth, two books, lights). Keep your voice low and your answers boring. Decide the non-negotiables in advance so you're not bargaining at 8pm.",
    deepInsight:
      "A fixed routine becomes a conditioned cue that triggers melatonin release before the child is even in bed. Decision-fatigue is real for kids too — fewer choices at night means a calmer descent into sleep.",
  },
  {
    title: "Bonding happens in small, device-free 'special time'",
    step: 2,
    principle:
      "Connection is built in frequent small deposits, not occasional grand gestures.",
    ageMin: 1,
    ageMax: 12,
    topics: ["bonding", "connection", "play"],
    triggers: ["bond", "bonding", "connect", "quality time", "play", "distant", "ignoring me"],
    guidance:
      "Give 10-15 minutes of fully undivided, child-led time daily — phone away, you follow their lead. Name it ('special time') so they can count on it. Watch behavior improve as the attention tank fills.",
    deepInsight:
      "Predictable one-on-one attention reduces attention-seeking misbehavior because the child no longer has to 'fish' for connection. Child-led play also signals safety, raising oxytocin and strengthening the secure attachment that makes discipline work.",
  },
  {
    title: "Sibling conflict: coach skills, don't play judge",
    step: 4,
    principle:
      "Refereeing who-started-it trains children to recruit you; coaching skills trains them to solve it.",
    ageMin: 3,
    ageMax: 12,
    topics: ["bonding", "siblings", "conflict"],
    triggers: ["sibling", "brother", "sister", "fighting", "share", "sharing", "jealous", "fair"],
    guidance:
      "Unless someone's in danger, describe the problem out loud ('Two kids, one truck') and hand it back: 'That's tricky — what's your plan?' Acknowledge both sides' feelings equally and resist assigning blame.",
    deepInsight:
      "When a parent acts as judge, siblings compete for the parent's favor instead of learning negotiation. Stepping back (while staying emotionally available) forces the rehearsal of perspective-taking and compromise — the actual skills of lifelong sibling bonds.",
  },
];

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set (check .env.local).");
  }
  const dbName = process.env.MONGODB_DB || "fyht4";

  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(dbName).collection<CodexEntry>("codexEntries");

  // Idempotent: replace by title.
  for (const entry of ENTRIES) {
    await col.updateOne(
      { title: entry.title },
      { $set: entry },
      { upsert: true }
    );
  }

  const count = await col.countDocuments();
  console.log(`Seeded ${ENTRIES.length} entries. Codex now has ${count} total.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
