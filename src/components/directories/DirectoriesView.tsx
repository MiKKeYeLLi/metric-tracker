"use client";

import { MOCK_DIRECTORIES } from "@/data/mockDirectories";

export function DirectoriesView() {
  const totalCount = MOCK_DIRECTORIES.length;
  const liveCount = MOCK_DIRECTORIES.filter((d) => d.status === "Live").length;
  const pendingCount = MOCK_DIRECTORIES.filter(
    (d) => d.status === "Pending review",
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Directories</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Every directory and listing site we have submitted to, or plan to, in
          one place.
        </p>
      </div>

      {/* Top Metric Cards Preview */}
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

      {/* Mock Data List Test */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-base mb-4">
          Mock Directories List ({totalCount})
        </h3>
        <div className="divide-y border-t text-sm">
          {MOCK_DIRECTORIES.map((directory) => (
            <div
              key={directory.id}
              className="py-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-foreground">{directory.name}</p>
                <p className="text-xs text-muted-foreground">
                  {directory.website}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                  {directory.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {directory.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
