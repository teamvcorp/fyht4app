"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { login, signup, type AuthState } from "@/app/actions/auth";
import { Wordmark } from "@/components/Wordmark";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined
  );

  const isSignup = mode === "signup";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/master.png"
          alt="The Master"
          width={200}
          height={280}
          priority
          className="h-auto w-[96px] drop-shadow-[0_14px_20px_rgba(109,40,217,0.25)]"
        />
        <Wordmark className="mt-3 text-2xl" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink/35">
          by FYHT4
        </p>
        <p className="mt-1 text-sm text-ink/60">
          {isSignup
            ? "Create your account to meet The Master."
            : "Welcome back. The Master awaits."}
        </p>
      </div>

      <form action={formAction} className="fyht-card flex flex-col gap-3 p-5">
        {isSignup && (
          <Field
            label="Your name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Alex"
          />
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "At least 8 characters" : "Your password"}
        />

        {state?.error && (
          <p className="rounded-xl bg-donow-50 px-3 py-2 text-sm font-medium text-donow">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
        >
          {pending
            ? "One moment…"
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink/60">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-bold text-brand"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-ink/50">
        {label}
      </span>
      <input
        {...props}
        required
        className="rounded-2xl bg-brand-50/60 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink/35 focus:bg-brand-50"
      />
    </label>
  );
}
