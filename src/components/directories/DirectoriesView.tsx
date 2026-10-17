"use client";

import { DirectoryProvider, useDirectories } from "@/context/DirectoryContext";
import { ActivityFeed } from "@/components/directories/ActivityFeed";
import {
  AddDirectoryModal,
  ImportCsvButton,
} from "@/components/directories/AddDirectoryModal";
import { DirectoryStatusBadge } from "@/components/directories/DirectoryStatusBadge";
import { DirectoryTable } from "@/components/directories/DirectoryTable";
import { SubmissionChecklist } from "@/components/directories/SubmissionChecklist";
import { SavedCopyWidget } from "@/components/directories/SavedCopyWidget";
import { PlusIcon, FileSpreadsheetIcon } from "lucide-react";

function DirectoryDashboard() {
  const { directories } = useDirectories();

  // Dynamic Metric calculations matching design specs
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
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Directories
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every directory and listing site we have submitted to, or plan to,
            in one place.
          </p>
        </div>
        <AddDirectoryModal triggerLabel="Add directory" />
      </div>

      {/* Top Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total directories
          </p>
          <p className="text-2xl font-bold mt-1 font-mono">{totalCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Live</p>
          <p className="text-2xl font-bold mt-1 font-mono text-emerald-600">
            {liveCount}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Pending review
          </p>
          <p className="text-2xl font-bold mt-1 font-mono text-amber-600">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Needs attention
          </p>
          <p className="text-2xl font-bold mt-1 font-mono text-rose-600">
            {needsAttentionCount}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Not submitted
          </p>
          <p className="text-2xl font-bold mt-1 font-mono text-slate-500">
            {notSubmittedCount}
          </p>
        </div>
      </div>

      {/* CONDITIONAL STATE VIEW */}
      {directories.length === 0 ? (
        /* --- EMPTY STATE VIEW (Image 1) --- */
        <div className="rounded-2xl border bg-card p-12 text-center shadow-sm flex flex-col items-center justify-center max-w-3xl mx-auto my-12">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-primary mb-4">
            <FileSpreadsheetIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            No directories yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            Log each directory you submit to and track its status from pending
            to live. You can also add a name you have not submitted to yet, so
            the team knows where to go next[cite: 1].
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <AddDirectoryModal triggerLabel="Add your first directory" />
            <ImportCsvButton
              label="Import from CSV"
              className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            />
          </div>

          <div className="border-t border-border pt-6 w-full">
            <p className="text-xs text-muted-foreground mb-3">
              Or start with a common directory
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Product Hunt",
                "BetaList",
                "Indie Hackers",
                "G2",
                "AlternativeTo",
                "SaaSHub",
              ].map((name) => (
                <button
                  key={name}
                  className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <PlusIcon className="w-3 h-3 mr-1 text-muted-foreground" />
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* --- POPULATED DATA VIEW (Image 2) --- */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main table slot */}
            <div className="lg:col-span-2 space-y-4">
              <DirectoryTable />
            </div>

            {/* Sidebar widgets slot */}
            <div className="space-y-6">
              <ActivityFeed />
              <SubmissionChecklist />
              <SavedCopyWidget />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DirectoriesView() {
  return (
    <DirectoryProvider>
      <DirectoryDashboard />
    </DirectoryProvider>
  );
}
