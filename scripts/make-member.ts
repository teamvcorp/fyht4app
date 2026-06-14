/**
 * Comp a paid membership to a user by email (sets subscriptionStatus active):
 *   npm run make-member -- you@email.com
 *
 * Runs against whatever MONGODB_URI is in .env.local — point that at the
 * production database to upgrade a production account.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

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
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email) {
    throw new Error("Usage: npm run make-member -- <email>");
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set (check .env.local).");

  const client = new MongoClient(uri);
  await client.connect();
  const users = client
    .db(process.env.MONGODB_DB || "fyht4")
    .collection("users");
  const res = await users.updateOne(
    { email },
    { $set: { subscriptionStatus: "active", compedAt: new Date() } }
  );
  if (res.matchedCount === 0) {
    console.error(
      `No user found with email ${email}. Register first, then re-run.`
    );
  } else {
    console.log(`✓ ${email} is now a member (subscriptionStatus: active).`);
  }
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
