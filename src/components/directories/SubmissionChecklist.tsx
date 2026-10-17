"use client";

import { useMemo, useState } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const SUBMISSION_CHECKLIST_ITEMS = [
  { id: "logo", label: "Logo (square and wide)" },
  { id: "screenshots", label: "Product screenshots" },
  { id: "tagline", label: "One-line tagline" },
  { id: "long-description", label: "Long description" },
  { id: "pricing", label: "Pricing details" },
] as const;

export type SubmissionChecklistItemId =
  (typeof SUBMISSION_CHECKLIST_ITEMS)[number]["id"];

/**
 * Sidebar widget: submission checklist (Teammate B).
 *
 * Matches the dashboard mockup card: bold title, helper sentence, one row per
 * asset with a solid-violet check square when done, and a mono ready-count.
 *
 * State: local by team decision (keep local unless the team agrees on a
 * shared/persistent implementation). When `value`/`onChange` are supplied the
 * component becomes controlled, so Denise's shared state can own the checked
 * ids later without any internal change.
 */
export function SubmissionChecklist({
  title = "Submission checklist",
  helper = "Have these ready before submitting anywhere.",
  value,
  onChange,
  className,
}: {
  title?: string;
  helper?: string;
  /** Controlled checked item ids. When omitted, the widget manages local state. */
  value?: readonly SubmissionChecklistItemId[];
  onChange?: (checked: SubmissionChecklistItemId[]) => void;
  className?: string;
}) {
  const [localChecked, setLocalChecked] = useState<
    readonly SubmissionChecklistItemId[]
  >([]);
  const checked = value ?? localChecked;
  const checkedSet = useMemo(() => new Set<string>(checked), [checked]);

  const toggle = (id: SubmissionChecklistItemId) => {
    const next = checked.includes(id)
      ? checked.filter((item) => item !== id)
      : [...checked, id];
    if (value === undefined) setLocalChecked(next);
    onChange?.(next);
  };

  const done = checkedSet.size;
  const total = SUBMISSION_CHECKLIST_ITEMS.length;

  return (
    <section
      aria-label={title}
      className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}
    >
      <h3 className="text-[13px] font-bold tracking-[-0.02em] text-foreground">
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>

      <ul className="mt-3 flex flex-col gap-0.5">
        {SUBMISSION_CHECKLIST_ITEMS.map((item) => {
          const isChecked = checkedSet.has(item.id);
          return (
            <li key={item.id}>
              <label className="group -mx-1 flex min-h-8 cursor-pointer items-center gap-2.5 rounded-md px-1 hover:bg-muted">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
                    "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                    isChecked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border-strong bg-card group-hover:border-muted-foreground/60",
                  )}
                >
                  {isChecked && <CheckIcon className="size-3" strokeWidth={3} />}
                </span>
                <span className="text-[13px] text-foreground">{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <p
        className="mt-2 border-t border-border pt-2 font-mono text-2xs text-muted-foreground"
        aria-live="polite"
      >
        {done} of {total} ready
      </p>
    </section>
  );
}
