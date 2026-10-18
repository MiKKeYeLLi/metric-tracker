"use client";

import { ErrorState } from "@/components/ErrorState";
import { Wordmark } from "@/components/Wordmark";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col px-[clamp(16px,5vw,48px)] pt-6 pb-12">
      <header className="shrink-0">
        <Wordmark href="/" />
      </header>
      <ErrorState digest={error.digest} onRetry={reset} />
    </main>
  );
}
