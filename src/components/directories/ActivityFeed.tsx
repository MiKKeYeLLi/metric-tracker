"use client";

import { ActivityIcon, ArrowUpRightIcon } from "lucide-react";
import { DirectoryStatusBadge } from "@/components/directories/DirectoryStatusBadge";
import { useDirectories } from "@/context/DirectoryContext";
import { DirectoryStatus } from "@/types/directory";

export function ActivityFeed() {
  const { activities = [], directories } = useDirectories();

  return (
    <div className="rounded-2xl bg-card shadow-[0_1px_2px_rgb(21_21_31/0.04)] ring-1 ring-border p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary-deep">
            <ActivityIcon className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Activity
            </p>
            <h3 className="text-sm font-semibold text-foreground">
              Recent updates
            </h3>
          </div>
        </div>
        <ArrowUpRightIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No activity yet. Add a directory to get started.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {activities.slice(0, 8).map((entry) => {
            const matchedDir = directories.find(
              (d) => d.name === entry.directoryName,
            );
            const displayStatus: DirectoryStatus =
              matchedDir?.status || entry.status || "Pending review";

            return (
              <li
                key={entry.id}
                className="rounded-xl bg-muted/60 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {entry.directoryName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {entry.owner || "Team"}
                      </span>{" "}
                      {entry.actionText} • {entry.timeAgo || "Just now"}
                    </p>
                  </div>
                  <DirectoryStatusBadge
                    status={displayStatus}
                    className="shrink-0"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ActivityFeed;
