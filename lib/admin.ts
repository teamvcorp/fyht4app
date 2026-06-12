import { getCurrentUser, isAdminUser } from "@/lib/user";
import type { UserDoc } from "@/lib/types";

/**
 * Returns the current user if they are an admin, otherwise throws.
 * Use at the top of every admin server action.
 */
export async function requireAdmin(): Promise<UserDoc> {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    throw new Error("Forbidden: admin only");
  }
  return user!;
}
