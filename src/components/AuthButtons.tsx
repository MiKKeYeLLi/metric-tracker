"use client";

import { signIn, signOut } from "next-auth/react";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Button
      size="xl"
      className="relative w-full shadow-[0_8px_24px_rgb(118_81_232/0.22)] hover:-translate-y-0.5"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      Sign in with Google
      <ChevronRightIcon
        data-icon="inline-end"
        aria-hidden="true"
        className="absolute right-5 transition-transform group-hover/button:translate-x-0.75"
      />
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button variant="outline" className="w-full" onClick={() => signOut()}>
      Sign out
    </Button>
  );
}
