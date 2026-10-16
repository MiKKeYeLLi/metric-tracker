"use client";

import { signIn, signOut } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      className="google-sign-in"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      Sign in with Google
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      className="w-full min-h-[36px] px-5 border border-line rounded-[10px] text-[13px] font-medium cursor-pointer text-muted bg-transparent transition-[color,background-color,border-color] duration-[120ms] hover:text-ink hover:bg-surface hover:border-line-strong"
      onClick={() => signOut()}
    >
      Sign out
    </button>
  );
}
