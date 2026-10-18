"use client";

import { DirectoryProvider, useDirectories } from "@/context/DirectoryContext";
import { ActivityFeed } from "@/components/directories/ActivityFeed";
import { AddDirectoryModal } from "@/components/directories/AddDirectoryModal";
import { DirectoryTable } from "@/components/directories/DirectoryTable";
import { SavedCopyWidget } from "@/components/directories/SavedCopyWidget";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { KpiCard, KpiGrid } from "@/components/KpiCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { DirectoryItem } from "@/types/directory";

const DAY_MS = 86_400_000;

function DirectoryDashboard() {
  const { directories, isLoading, loadError, reload, actionError, clearActionError } = useDirectories();
  const [statusFilter, setStatusFilter] = useState("all");
  const figure = (value: number) => (isLoading || loadError ? "–" : value.toLocaleString());

  const now = Date.now();
  const submitted = directories.filter((d) => d.status !== "Not submitted");
  const submittedDays = (d: DirectoryItem) => {
    if (!d.dateSubmitted) return null;
    const timestamp = Date.parse(`${d.dateSubmitted}T00:00:00Z`);
    return Number.isNaN(timestamp) ? null : Math.floor((now - timestamp) / DAY_MS);
  };
  const submittedThisMonth = submitted.filter((d) => {
    const days = submittedDays(d);
    return days !== null && days <= 30;
  }).length;
  const liveCount = directories.filter((d) => d.status === "Live").length;
  const pending = directories.filter((d) => d.status === "Pending review");
  const oldestWaiting = Math.max(0, ...pending.map((d) => submittedDays(d) ?? 0));
  const needsChanges = directories.filter((d) => d.status === "Needs changes").length;
  const rejected = directories.filter((d) => d.status === "Rejected").length;
  const shortlisted = directories.length - submitted.length;
  const liveRate = submitted.length ? Math.round((liveCount / submitted.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Directories"
        description="Every directory and listing site we have submitted to, or plan to, in one place."
        actions={<AddDirectoryModal triggerLabel="Add directory" />}
      />

      <PageContent>
        <KpiGrid>
          <KpiCard
            title="Total directories"
            value={figure(directories.length)}
            delta={
              isLoading || loadError
                ? undefined
                : { label: `+${submittedThisMonth}`, direction: submittedThisMonth > 0 ? "up" : "flat", favorable: true }
            }
            comparison={`submitted in 30 days · ${shortlisted} on the shortlist`}
            action={{ label: "Show all directories", onClick: () => setStatusFilter("all") }}
          />
          <KpiCard
            title="Live"
            value={figure(liveCount)}
            context={submitted.length ? `${liveRate}% of submissions are live` : "Nothing submitted yet"}
            action={{ label: "Show live directories", onClick: () => setStatusFilter("Live") }}
          />
          <KpiCard
            title="Pending review"
            value={figure(pending.length)}
            context={
              pending.length
                ? `Oldest waiting ${oldestWaiting} ${oldestWaiting === 1 ? "day" : "days"}`
                : "Nothing waiting on a directory"
            }
            action={{ label: "Show directories pending review", onClick: () => setStatusFilter("Pending review") }}
          />
          <KpiCard
            title="Needs attention"
            value={figure(needsChanges + rejected)}
            context={`${needsChanges} need changes · ${rejected} rejected`}
            action={{ label: "Show directories that need attention", onClick: () => setStatusFilter("attention") }}
          />
        </KpiGrid>

        {actionError && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{actionError}</span>
              <Button type="button" variant="ghost" size="sm" onClick={clearActionError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loadError && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <DirectoryTable statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <ActivityFeed />
          <SavedCopyWidget />
        </div>
      </PageContent>
    </>
  );
}

export function DirectoriesView() {
  return (
    <DirectoryProvider>
      <DirectoryDashboard />
    </DirectoryProvider>
  );
}
