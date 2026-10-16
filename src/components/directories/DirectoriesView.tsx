"use client";

import { DirectoryProvider, useDirectories } from "@/context/DirectoryContext";

function DirectoryDashboard() {
  const { directories } = useDirectories();

  const totalCount = directories.length;
  const liveCount = directories.filter((d) => d.status === "Live").length;
  const pendingCount = directories.filter(
    (d) => d.status === "Pending review",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Directories</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Every directory and listing site we have submitted to, or plan to, in
          one place.
        </p>
      </div>

      {/* Dynamic Metric Cards using your state */}
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
      </div>
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
