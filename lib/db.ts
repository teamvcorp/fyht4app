import type { Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type {
  UserDoc,
  CodexEntry,
  ConversationDoc,
  Principle,
  SubjectDoc,
} from "@/lib/types";

export async function usersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  return db.collection<UserDoc>("users");
}

export async function codexCollection(): Promise<Collection<CodexEntry>> {
  const db = await getDb();
  return db.collection<CodexEntry>("codexEntries");
}

export async function principlesCollection(): Promise<Collection<Principle>> {
  const db = await getDb();
  return db.collection<Principle>("principles");
}

export async function conversationsCollection(): Promise<
  Collection<ConversationDoc>
> {
  const db = await getDb();
  return db.collection<ConversationDoc>("conversations");
}

export async function subjectsCollection(): Promise<Collection<SubjectDoc>> {
  const db = await getDb();
  return db.collection<SubjectDoc>("subjects");
}
