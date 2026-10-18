"use client";

import { DirectoryProvider, useDirectories } from "@/context/DirectoryContext";
import { ActivityFeed } from "@/components/directories/ActivityFeed";
import {
  AddDirectoryModal,
  ImportCsvButton,
} from "@/components/directories/AddDirectoryModal";
import { DirectoryTable } from "@/components/directories/DirectoryTable";
import { SubmissionChecklist } from "@/components/directories/SubmissionChecklist";
import { SavedCopyWidget } from "@/components/directories/SavedCopyWidget";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { StatCard, StatGrid } from "@/components/StatCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  CircleCheckIcon,
  CircleDashedIcon,
  FileSpreadsheetIcon,
  FolderOpenIcon,
  HourglassIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";

function DirectoryDashboard() {
  const { directories } = useDirectories();

  const totalCount = directories.length;
  const liveCount = directories.filter((d) => d.status === "Live").length;
  const pendingCount = directories.filter(
    (d) => d.status === "Pending review",
  ).length;
  const needsAttentionCount = directories.filter(
    (d) => d.status === "Needs changes" || d.status === "Rejected",
  ).length;
  const notSubmittedCount = directories.filter(
    (d) => d.status === "Not submitted",
  ).length;

  return (
    <>
      <PageHeader
        title="Directories"
        description="Every directory and listing site we have submitted to, or plan to, in one place."
        actions={<AddDirectoryModal triggerLabel="Add directory" />}
      />

      <PageContent>
        <StatGrid className="xl:grid-cols-5">
          <StatCard label="Total directories" value={totalCount} icon={<FolderOpenIcon aria-hidden="true" />} />
          <StatCard label="Live" value={liveCount} icon={<CircleCheckIcon aria-hidden="true" />} hint="Listed and visible" tone="success" />
          <StatCard label="Pending review" value={pendingCount} icon={<HourglassIcon aria-hidden="true" />} hint="Waiting on the directory" />
          <StatCard
            label="Needs attention"
            value={needsAttentionCount}
            icon={<TriangleAlertIcon aria-hidden="true" />}
            hint="Changes requested or rejected"
            tone={needsAttentionCount > 0 ? "warning" : "neutral"}
          />
          <StatCard label="Not submitted" value={notSubmittedCount} icon={<CircleDashedIcon aria-hidden="true" />} hint="On the shortlist" />
        </StatGrid>

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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
              <DirectoryTable />
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <ActivityFeed />
              <SubmissionChecklist />
              <SavedCopyWidget />
            </div>
          </div>
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
