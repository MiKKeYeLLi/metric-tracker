import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col px-[clamp(16px,5vw,48px)] pt-6 pb-12">
      <header className="shrink-0">
        <Wordmark href="/" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="relative mb-8 flex items-center justify-center select-none" aria-hidden="true">
          <span className="relative z-1 bg-linear-160 from-accent to-background bg-clip-text px-6 py-4 font-mono text-[clamp(96px,18vw,168px)] leading-none font-medium tracking-[-0.04em] text-transparent [-webkit-text-stroke:1.5px_var(--border-strong)]">
            404
          </span>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-size-[28px_28px] mask-[radial-gradient(ellipse_60%_55%_at_50%_50%,#000_30%,transparent_100%)]" />
        </div>

        <div className="flex max-w-100 flex-col items-center gap-2.5 text-center">
          <h1 className="m-0 text-[clamp(18px,3vw,24px)] font-bold tracking-[-0.03em] text-foreground">
            Page not found
          </h1>
          <p className="mb-2 text-sm/relaxed text-balance text-muted-foreground">
            This page doesn&apos;t exist or has been moved. Head back to the
            dashboard to pick up where you left off.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">
              Go to dashboard
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
