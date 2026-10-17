"use client";

import { FormEvent, useMemo, useState } from "react";
import { DownloadIcon, MoreVerticalIcon, SearchIcon } from "lucide-react";
import { useDirectories } from "@/context/DirectoryContext";
import { DirectoryItem, DirectoryStatus, Priority } from "@/types/directory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DirectoryStatusBadge } from "@/components/directories/DirectoryStatusBadge";

const teamMembers = ["Denise", "Rabiah", "Kanyisola", "Roy"] as const;

const priorityStyles: Record<Priority, string> = {
  High: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  Medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  Low: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
};

function websiteHref(website: string) {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function formatSubmittedDate(dateSubmitted: string) {
  if (!dateSubmitted || dateSubmitted === "-") {
    return "—";
  }

  const date = new Date(dateSubmitted);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function csvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportDirectoriesToCsv(directories: DirectoryItem[]) {
  const rows = [
    [
      "Directory",
      "Website",
      "Status",
      "Priority",
      "Submitted by",
      "Date submitted",
      "Listing URL",
    ],
    ...directories.map((directory) => [
      directory.name,
      directory.website,
      directory.status,
      directory.priority,
      directory.submittedBy,
      formatSubmittedDate(directory.dateSubmitted),
      directory.listingUrl ?? "",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = `directories-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function DirectoryTable() {
  const { directories, updateDirectory } = useDirectories();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("everyone");
  const [priorityFilter, setPriorityFilter] = useState("any");
  const [editingDirectory, setEditingDirectory] = useState<DirectoryItem | null>(
    null,
  );
  const [editForm, setEditForm] = useState({
    name: "",
    website: "",
    status: "Not submitted" as DirectoryStatus,
    submittedBy: "Nobody yet",
    priority: "Medium" as Priority,
    listingUrl: "",
    notes: "",
  });

  const openEditDirectory = (directory: DirectoryItem) => {
    setEditForm({
      name: directory.name,
      website: directory.website,
      status: directory.status,
      submittedBy: directory.submittedBy,
      priority: directory.priority,
      listingUrl: directory.listingUrl ?? "",
      notes: directory.notes ?? "",
    });
    setEditingDirectory(directory);
  };

  const saveDirectory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingDirectory) {
      return;
    }

    updateDirectory({
      ...editingDirectory,
      ...editForm,
      listingUrl: editForm.listingUrl.trim() || undefined,
      notes: editForm.notes.trim() || undefined,
    });
    setEditingDirectory(null);
  };

  const filteredDirectories = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return directories.filter((directory) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        directory.name.toLocaleLowerCase().includes(normalizedSearch) ||
        directory.website.toLocaleLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" || directory.status === statusFilter;
      const matchesMember =
        memberFilter === "everyone" ||
        (memberFilter === "nobody"
          ? directory.submittedBy === "Nobody yet"
          : directory.submittedBy === memberFilter);
      const matchesPriority =
        priorityFilter === "any" || directory.priority === priorityFilter;

      return (
        matchesSearch && matchesStatus && matchesMember && matchesPriority
      );
    });
  }, [directories, memberFilter, priorityFilter, search, statusFilter]);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-1 gap-2 border-b border-border p-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <div className="relative min-w-0">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search by directory name"
            className="h-8 pl-8 text-[11px] placeholder:text-[11px]"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by directory name..."
            type="search"
            value={search}
          />
        </div>

        <NativeSelect
          aria-label="Filter by status"
          className="w-full min-w-0"
          onChange={(event) => setStatusFilter(event.target.value)}
          size="sm"
          value={statusFilter}
        >
          <NativeSelectOption value="all">All statuses</NativeSelectOption>
          {(
            [
              "Live",
              "Pending review",
              "Needs changes",
              "Rejected",
              "Not submitted",
            ] as DirectoryStatus[]
          ).map((status) => (
            <NativeSelectOption key={status} value={status}>
              {status}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filter by team member"
          className="w-full min-w-0"
          onChange={(event) => setMemberFilter(event.target.value)}
          size="sm"
          value={memberFilter}
        >
          <NativeSelectOption value="everyone">Everyone</NativeSelectOption>
          {teamMembers.map((member) => (
            <NativeSelectOption key={member} value={member}>
              {member}
            </NativeSelectOption>
          ))}
          <NativeSelectOption value="nobody">Nobody yet</NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          aria-label="Filter by priority"
          className="w-full min-w-0"
          onChange={(event) => setPriorityFilter(event.target.value)}
          size="sm"
          value={priorityFilter}
        >
          <NativeSelectOption value="any">Any priority</NativeSelectOption>
          {(["High", "Medium", "Low"] as Priority[]).map((priority) => (
            <NativeSelectOption key={priority} value={priority}>
              {priority}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <Table className="table-fixed">
        <TableHeader className="[&_tr]:border-b">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[20%] px-2 py-2 text-[10px] align-middle">
              Directory
            </TableHead>
            <TableHead className="w-[22%] px-2 py-2 text-[10px] align-middle">
              Status
            </TableHead>
            <TableHead className="w-[14%] px-2 py-2 text-[10px] align-middle">
              Submitted by
            </TableHead>
            <TableHead className="w-[14%] px-2 py-2 text-[10px] align-middle">
              Date submitted
            </TableHead>
            <TableHead className="w-[9%] px-2 py-2 text-[10px] align-middle">
              Priority
            </TableHead>
            <TableHead className="w-[15%] px-2 py-2 text-[10px] align-middle">
              Listing
            </TableHead>
            <TableHead className="w-[6%] px-2 py-2 text-[10px] align-middle">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDirectories.length > 0 ? (
            filteredDirectories.map((directory) => (
              <TableRow key={directory.id} className="h-[58px] text-xs">
                <TableCell className="min-w-0 px-2 py-2 align-middle">
                  <div
                    className="truncate font-semibold leading-tight text-foreground"
                    title={directory.name}
                  >
                    {directory.name}
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] leading-tight text-muted-foreground">
                    <a
                      className="min-w-0 truncate hover:text-primary hover:underline"
                      href={websiteHref(directory.website)}
                      rel="noreferrer"
                      target="_blank"
                      title={directory.website}
                    >
                      {directory.website}
                    </a>
                    {directory.status === "Not submitted" && (
                      <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                        Suggested
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2 align-middle">
                  <DirectoryStatusBadge
                    className="h-auto max-w-full shrink-0 gap-1 whitespace-nowrap px-1.5 py-0.5 text-[10px] leading-tight"
                    status={directory.status}
                  />
                </TableCell>
                <TableCell className="px-2 py-2 align-middle text-[11px]">
                  <span
                    className={`block truncate ${
                      directory.submittedBy === "Nobody yet"
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}
                    title={directory.submittedBy}
                  >
                    {directory.submittedBy}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap px-2 py-2 align-middle text-[10px] text-muted-foreground">
                  {formatSubmittedDate(directory.dateSubmitted)}
                </TableCell>
                <TableCell className="px-2 py-2 align-middle">
                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${priorityStyles[directory.priority]}`}
                  >
                    {directory.priority}
                  </span>
                </TableCell>
                <TableCell className="px-2 py-2 align-middle text-[10px]">
                  {directory.listingUrl ? (
                    <a
                      className="block truncate font-medium text-primary hover:underline"
                      href={directory.listingUrl}
                      rel="noreferrer"
                      target="_blank"
                      title={directory.listingUrl}
                    >
                      View listing ↗
                    </a>
                  ) : (
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      Not yet
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-2 py-2 text-right align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={`Actions for ${directory.name}`}
                        className="text-muted-foreground"
                        size="icon-xs"
                        variant="ghost"
                      >
                        <MoreVerticalIcon aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onSelect={() => openEditDirectory(directory)}
                      >
                        Edit Directory
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          window.open(
                            websiteHref(directory.website),
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        Open directory website
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="h-24 text-center text-sm text-muted-foreground"
                colSpan={7}
              >
                No directories match these filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-3 py-2.5 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          Showing {filteredDirectories.length} of {directories.length}{" "}
          directories
        </p>
        <Button
          onClick={() => exportDirectoriesToCsv(filteredDirectories)}
          size="sm"
          variant="outline"
          className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <DownloadIcon aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingDirectory(null);
          }
        }}
        open={editingDirectory !== null}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Directory</DialogTitle>
            <DialogDescription>
              Update directory details, status, assignment, and listing
              information.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveDirectory}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium">
                Directory name
                <Input
                  className="h-9 text-sm"
                  onChange={(event) =>
                    setEditForm({ ...editForm, name: event.target.value })
                  }
                  required
                  value={editForm.name}
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium">
                Website
                <Input
                  className="h-9 text-sm"
                  onChange={(event) =>
                    setEditForm({ ...editForm, website: event.target.value })
                  }
                  required
                  value={editForm.website}
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium">
                Status
                <NativeSelect
                  className="w-full"
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      status: event.target.value as DirectoryStatus,
                    })
                  }
                  value={editForm.status}
                >
                  {(
                    [
                      "Live",
                      "Pending review",
                      "Needs changes",
                      "Rejected",
                      "Not submitted",
                    ] as DirectoryStatus[]
                  ).map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {status}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <label className="space-y-1.5 text-xs font-medium">
                Submitted by
                <NativeSelect
                  className="w-full"
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      submittedBy: event.target.value,
                    })
                  }
                  value={editForm.submittedBy}
                >
                  <NativeSelectOption value="Nobody yet">
                    Nobody yet
                  </NativeSelectOption>
                  {teamMembers.map((member) => (
                    <NativeSelectOption key={member} value={member}>
                      {member}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <label className="space-y-1.5 text-xs font-medium">
                Priority
                <NativeSelect
                  className="w-full"
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      priority: event.target.value as Priority,
                    })
                  }
                  value={editForm.priority}
                >
                  {(["High", "Medium", "Low"] as Priority[]).map((priority) => (
                    <NativeSelectOption key={priority} value={priority}>
                      {priority}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <label className="space-y-1.5 text-xs font-medium sm:col-span-2">
                Listing URL
                <Input
                  className="h-9 text-sm"
                  onChange={(event) =>
                    setEditForm({ ...editForm, listingUrl: event.target.value })
                  }
                  placeholder="https://"
                  type="url"
                  value={editForm.listingUrl}
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium sm:col-span-2">
                Notes
                <textarea
                  className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                  onChange={(event) =>
                    setEditForm({ ...editForm, notes: event.target.value })
                  }
                  value={editForm.notes}
                />
              </label>
            </div>
            <DialogFooter className="mt-5">
              <Button
                onClick={() => setEditingDirectory(null)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
