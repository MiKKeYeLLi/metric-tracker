"use client";

import { useState } from "react";
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  PencilLineIcon,
  SendIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { useDirectories } from "@/context/DirectoryContext";
import { cn } from "@/lib/utils";
import type { DirectoryStatus } from "@/types/directory";

const STATUS_ICON: Record<DirectoryStatus, { icon: LucideIcon; tone: string }> = {
  Live: { icon: CircleCheckIcon, tone: "bg-success-muted text-success" },
  "Pending review": { icon: SendIcon, tone: "bg-info-muted text-info" },
  "Needs changes": { icon: PencilLineIcon, tone: "bg-warning-muted text-warning" },
  Rejected: { icon: CircleXIcon, tone: "bg-destructive-muted text-destructive" },
  "Not submitted": { icon: CircleDashedIcon, tone: "bg-muted text-muted-foreground" },
};

const PREVIEW_COUNT = 6;
const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(timestamp: number) {
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "Just now";
}

export function ActivityFeed() {
  const { activities = [] } = useDirectories();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? activities : activities.slice(0, PREVIEW_COUNT);

  return (
    <section
      aria-labelledby="activity-title"
      className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="activity-title" className="m-0 text-[17px] leading-tight font-bold tracking-[-0.02em] text-foreground">
          Recent updates
        </h2>
        <p className="m-0 text-[13px] text-muted-foreground">Latest changes across your directories</p>
      </div>

      {activities.length === 0 ? (
        <Empty className="rounded-2xl border border-dashed py-10">
          <EmptyHeader>
            <EmptyTitle>No updates yet</EmptyTitle>
            <EmptyDescription>Submissions and status changes will show up here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {visible.map((entry, index) => {
            const { icon: Icon, tone } = STATUS_ICON[entry.status] ?? STATUS_ICON["Not submitted"];
            const isLast = index === visible.length - 1;
            return (
              <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                {!isLast && (
                  <span aria-hidden="true" className="absolute top-9 bottom-0 left-4 w-px -translate-x-1/2 bg-border" />
                )}
                <span
                  aria-hidden="true"
                  className={cn("relative flex size-8 shrink-0 items-center justify-center rounded-full", tone)}
                >
                  <Icon className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5 pt-1">
                  <p className="m-0 text-sm leading-snug font-medium text-foreground">
                    {entry.actionText}
                  </p>
                  <p className="m-0 text-xs text-faint-foreground">
                    <time dateTime={new Date(entry.timestamp).toISOString()} className="text-muted-foreground">
                      {timeAgo(entry.timestamp)}
                    </time>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {activities.length > PREVIEW_COUNT && (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show fewer" : `Show all ${activities.length}`}
        </Button>
      )}
    </section>
  );
}

export default ActivityFeed;
