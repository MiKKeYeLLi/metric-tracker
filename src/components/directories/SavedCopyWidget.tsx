"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SavedCopyBlock {
  id: string;
  label: string;
  text: string;
}

const COPY_FEEDBACK_MS = 1600;

/** Clearly-labelled sample copy — replace with approved company copy via the `blocks` prop. */
export const SAMPLE_COPY_BLOCKS: SavedCopyBlock[] = [
  {
    id: "tagline",
    label: "Tagline",
    text: "[Sample text · replace with approved copy] Track every directory that matters.",
  },
  {
    id: "short",
    label: "Short description",
    text: "[Sample text · replace with approved copy] Metric Tracker keeps our directory submissions in one calm place.",
  },
  {
    id: "long",
    label: "Long description",
    text: "[Sample text · replace with approved copy] Metric Tracker brings content, SEO, social and paid metrics into one workspace the whole team can scan.",
  },
];

/**
 * Sidebar widget: saved submission copy (Teammate B).
 *
 * Matches the dashboard mockup card: bold title, helper sentence, one bordered
 * row per block with a violet Copy action. "Copied!" is shown only after
 * `navigator.clipboard.writeText` resolves; "Failed" appears on rejection;
 * both revert after ~1.6s and are announced via aria-live.
 */
export function SavedCopyWidget({
  blocks = SAMPLE_COPY_BLOCKS,
  title = "Saved submission copy",
  helper = "Reusable text so every listing says the same thing.",
  className,
}: {
  blocks?: SavedCopyBlock[];
  title?: string;
  helper?: string;
  className?: string;
}) {
  const [feedback, setFeedback] = useState<
    { id: string; ok: boolean } | undefined
  >(undefined);

  // Clear the feedback after the reveal window; cleaned up on re-copy/unmount
  // so a stale timer never overwrites a newer message.
  useEffect(() => {
    if (feedback === undefined) return;
    const timer = window.setTimeout(
      () => setFeedback(undefined),
      COPY_FEEDBACK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const copy = async (block: SavedCopyBlock) => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available in this browser");
      }
      await navigator.clipboard.writeText(block.text);
      setFeedback({ id: block.id, ok: true });
    } catch {
      setFeedback({ id: block.id, ok: false });
    }
  };

  return (
    <section
      aria-label={title}
      className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}
    >
      <h3 className="text-[13px] font-bold tracking-[-0.02em] text-foreground">
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>

      <div className="mt-3 flex flex-col gap-2">
        {blocks.map((block) => {
          const state = feedback?.id === block.id ? feedback : undefined;
          return (
            <div
              key={block.id}
              className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2.5"
            >
              <span className="text-[13px] text-foreground" title={block.text}>
                {block.label}
              </span>
              <button
                type="button"
                onClick={() => copy(block)}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer",
                  state?.ok
                    ? "text-success"
                    : state?.ok === false
                      ? "text-destructive"
                      : "text-primary hover:text-primary-deep",
                )}
              >
                {state?.ok ? "Copied!" : state?.ok === false ? "Failed" : "Copy"}
              </button>
              <span className="sr-only" aria-live="polite">
                {state?.ok
                  ? `${block.label} copied to clipboard`
                  : state?.ok === false
                    ? `Copying ${block.label} failed`
                    : ""}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
