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
    <button className="sign-out" onClick={() => signOut()}>
      Sign out
    </button>
  );
}
