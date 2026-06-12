"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { usersCollection } from "@/lib/db";

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(80),
  email: z.email("Please enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200),
});

export type AuthState = { error?: string } | undefined;

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const users = await usersCollection();

  const existing = await users.findOne({ email });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await users.insertOne({
    name: parsed.data.name,
    email,
    passwordHash,
    subscriptionStatus: "none",
    createdAt: new Date(),
  });

  // Sign the user straight in after creating the account.
  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/",
  });
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    // A successful sign-in throws a NEXT_REDIRECT control-flow error that must
    // propagate; only auth failures are surfaced to the form.
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }
}
