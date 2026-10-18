"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SignInButton() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={isRedirecting}
      onClick={() => {
        setIsRedirecting(true);
        void signIn("google", { callbackUrl: "/dashboard" });
      }}
    >
      {isRedirecting && <Spinner data-icon="inline-start" />}
      {isRedirecting ? "Opening Google…" : "Continue with Google"}
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Sign out"
      title="Sign out"
      className="text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      onClick={() => signOut()}
    >
      <LogOutIcon aria-hidden="true" />
    </Button>
  );
}
