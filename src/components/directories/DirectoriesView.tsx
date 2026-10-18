"use client";

import { DirectoryProvider, useDirectories } from "@/context/DirectoryContext";
import { ActivityFeed } from "@/components/directories/ActivityFeed";
import {
  AddDirectoryModal,
  ImportCsvButton,
} from "@/components/directories/AddDirectoryModal";
import { DirectoryTable } from "@/components/directories/DirectoryTable";
import { SavedCopyWidget } from "@/components/directories/SavedCopyWidget";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { KpiCard, KpiGrid } from "@/components/KpiCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FileSpreadsheetIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import type { DirectoryItem } from "@/types/directory";

const DAY_MS = 86_400_000;

function DirectoryDashboard() {
  const { directories } = useDirectories();
  const [statusFilter, setStatusFilter] = useState("all");

  const now = Date.now();
  const submitted = directories.filter((d) => d.status !== "Not submitted");
  const submittedDays = (d: DirectoryItem) => {
    const timestamp = Date.parse(d.dateSubmitted);
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
            value={directories.length.toLocaleString()}
            delta={{
              label: `+${submittedThisMonth}`,
              direction: submittedThisMonth > 0 ? "up" : "flat",
              favorable: true,
            }}
            comparison={`submitted in 30 days · ${shortlisted} on the shortlist`}
            action={{ label: "Show all directories", onClick: () => setStatusFilter("all") }}
          />
          <KpiCard
            title="Live"
            value={liveCount.toLocaleString()}
            context={submitted.length ? `${liveRate}% of submissions are live` : "Nothing submitted yet"}
            action={{ label: "Show live directories", onClick: () => setStatusFilter("Live") }}
          />
          <KpiCard
            title="Pending review"
            value={pending.length.toLocaleString()}
            context={
              pending.length
                ? `Oldest waiting ${oldestWaiting} ${oldestWaiting === 1 ? "day" : "days"}`
                : "Nothing waiting on a directory"
            }
            action={{ label: "Show directories pending review", onClick: () => setStatusFilter("Pending review") }}
          />
          <KpiCard
            title="Needs attention"
            value={(needsChanges + rejected).toLocaleString()}
            context={`${needsChanges} need changes · ${rejected} rejected`}
            action={{ label: "Show directories that need attention", onClick: () => setStatusFilter("attention") }}
          />
        </KpiGrid>

        {directories.length === 0 ? (
          <Empty className="mx-auto my-6 w-full max-w-3xl rounded-2xl bg-card ring-1 ring-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileSpreadsheetIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No directories yet</EmptyTitle>
              <EmptyDescription>
                Log each directory you submit to and track its status from pending to live. You can also add a name you
                have not submitted to yet, so the team knows where to go next.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <AddDirectoryModal triggerLabel="Add your first directory" />
                <ImportCsvButton label="Import from CSV" className={buttonVariants({ variant: "outline" })} />
              </div>
              <div className="flex w-full flex-col gap-3 border-t pt-6">
                <p className="m-0 text-xs text-muted-foreground">Or start with a common directory</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Product Hunt", "BetaList", "Indie Hackers", "G2", "AlternativeTo", "SaaSHub"].map((name) => (
                    <Button key={name} type="button" variant="outline" size="sm">
                      <PlusIcon data-icon="inline-start" aria-hidden="true" />
                      {name}
                    </Button>
                  ))}
                </div>
              </div>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <DirectoryTable statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <ActivityFeed />
              <SavedCopyWidget />
            </div>
          </>
        )}
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
