import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { usersCollection } from "@/lib/db";
import type { UserDoc } from "@/lib/types";

/** Returns the full user document for the signed-in user, or null. */
export async function getCurrentUser(): Promise<UserDoc | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const users = await usersCollection();
  try {
    return await users.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

export function isActiveMember(user: UserDoc | null): boolean {
  return user?.subscriptionStatus === "active";
}

export function isAdminUser(user: UserDoc | null): boolean {
  return user?.isAdmin === true;
}
