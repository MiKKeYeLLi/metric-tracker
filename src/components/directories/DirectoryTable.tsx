"use client";

import { FormEvent, useMemo, useState } from "react";
import { PillSelect, SearchPill, Toolbar, ToolbarGroup } from "@/components/Toolbar";
import {
  ArrowUpRightIcon,
  CheckIcon,
  DownloadIcon,
  Edit3Icon,
  ExternalLinkIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useDirectories } from "@/context/DirectoryContext";
import { DirectoryItem, DirectoryStatus, Priority } from "@/types/directory";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DirectoryStatusBadge } from "@/components/directories/DirectoryStatusBadge";
import {
  ChecklistButton,
  DEFAULT_CHECKLIST_ITEMS,
  SubmissionChecklistDialog,
  type CustomChecklistItems,
} from "@/components/directories/SubmissionChecklist";
import { cn } from "@/lib/utils";

const priorityStyles: Record<Priority, string> = {
  High: "border-destructive/20 bg-destructive-muted text-destructive",
  Medium: "border-warning/20 bg-warning-muted text-warning",
  Low: "border-border bg-secondary text-muted-foreground",
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
    return dateSubmitted;
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
      "Date submitted",
      "Listing URL",
    ],
    ...directories.map((directory) => [
      directory.name,
      directory.website,
      directory.status,
      directory.priority,
      formatSubmittedDate(directory.dateSubmitted),
      directory.listingUrl ?? "",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = `directories-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function ActionMenu({
  directory,
  openEditDirectory,
  openChecklist,
  deleteDirectory,
}: {
  directory: DirectoryItem;
  openEditDirectory: (dir: DirectoryItem) => void;
  openChecklist: (dir: DirectoryItem) => void;
  deleteDirectory: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`Actions for ${directory.name}`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "pointer-fine:opacity-0 pointer-fine:group-hover/row:opacity-100 pointer-fine:group-focus-within/row:opacity-100 aria-expanded:opacity-100"
        )}
      >
        <MoreHorizontalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => openEditDirectory(directory)}>
          <Edit3Icon aria-hidden="true" />
          Edit details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openChecklist(directory)}>
          <ListChecksIcon aria-hidden="true" />
          Submission checklist
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => window.open(websiteHref(directory.website), "_blank", "noopener,noreferrer")}>
          <ExternalLinkIcon aria-hidden="true" />
          Open website
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => deleteDirectory(directory.id)}>
          <Trash2Icon aria-hidden="true" />
          Delete directory
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DirectoryTable({
  statusFilter: controlledStatusFilter,
  onStatusFilterChange,
}: {
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
} = {}) {
  const {
    directories,
    updateDirectory,
    deleteDirectory,
    selectedDirectoryId,
    setSelectedDirectoryId,
    checklistState,
  } = useDirectories();
  const [search, setSearch] = useState("");
  const [internalStatusFilter, setInternalStatusFilter] = useState("all");
  const statusFilter = controlledStatusFilter ?? internalStatusFilter;
  const setStatusFilter = onStatusFilterChange ?? setInternalStatusFilter;
  const [priorityFilter, setPriorityFilter] = useState("any");
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [customChecklistItems, setCustomChecklistItems] = useState<CustomChecklistItems>({});
  const [editingDirectory, setEditingDirectory] =
    useState<DirectoryItem | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    website: "",
    status: "Not submitted" as DirectoryStatus,
    priority: "Medium" as Priority,
    listingUrl: "",
    notes: "",
  });

  const openEditDirectory = (directory: DirectoryItem) => {
    setEditForm({
      name: directory.name,
      website: directory.website,
      status: directory.status,
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

    updateDirectory(editingDirectory.id, {
      name: editForm.name.trim(),
      website: editForm.website.trim(),
      status: editForm.status,
      priority: editForm.priority,
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
        statusFilter === "all" ||
        (statusFilter === "attention"
          ? directory.status === "Needs changes" || directory.status === "Rejected"
          : directory.status === statusFilter);
      const matchesPriority =
        priorityFilter === "any" || directory.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [directories, priorityFilter, search, statusFilter]);

  const checklistProgress = (directoryId: string) => {
    const items = [...DEFAULT_CHECKLIST_ITEMS, ...(customChecklistItems[directoryId] ?? [])];
    const checked = checklistState[directoryId] ?? {};
    return { done: items.filter((item) => checked[item.id]).length, total: items.length };
  };

  const openChecklistFor = (directoryId: string) => {
    setSelectedDirectoryId(directoryId);
    setIsChecklistOpen(true);
  };

  const hasActiveFilters =
    search !== "" || statusFilter !== "all" || priorityFilter !== "any";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("any");
  };

  return (
    <>
      <Toolbar>
        <ToolbarGroup className="md:flex-1">
          <SearchPill value={search} onChange={setSearch} placeholder="Search directories" />
          <ChecklistButton customItems={customChecklistItems} onClick={() => setIsChecklistOpen(true)} />
        </ToolbarGroup>
        <ToolbarGroup>
          <PillSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All" },
              ...(["Live", "Pending review", "Needs changes", "Rejected", "Not submitted"] as DirectoryStatus[]).map(
                (status) => ({ value: status, label: status })
              ),
              { value: "attention", label: "Needs attention" },
            ]}
          />
          <PillSelect
            label="Priority"
            value={priorityFilter}
            onChange={setPriorityFilter}
            defaultValue="any"
            options={[
              { value: "any", label: "Any" },
              ...(["High", "Medium", "Low"] as Priority[]).map((priority) => ({ value: priority, label: priority })),
            ]}
          />
          {hasActiveFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters} className="shrink-0">
              <XIcon data-icon="inline-start" aria-hidden="true" />
              Clear
            </Button>
          )}
        </ToolbarGroup>
      </Toolbar>

      <section
        aria-labelledby="directories-table-title"
        className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-border bg-card p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id="directories-table-title" className="m-0 text-[17px] leading-tight font-bold tracking-[-0.02em] text-foreground">
              All directories
            </h2>
            <p className="m-0 text-[13px] text-muted-foreground tabular-nums">
              {filteredDirectories.length === directories.length
                ? `${directories.length} ${directories.length === 1 ? "directory" : "directories"}`
                : `${filteredDirectories.length} of ${directories.length} directories`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDirectoriesToCsv(filteredDirectories)}
            disabled={filteredDirectories.length === 0}
          >
            <DownloadIcon data-icon="inline-start" aria-hidden="true" />
            Export CSV
          </Button>
        </div>

        {filteredDirectories.length === 0 ? (
          <Empty className="rounded-2xl border border-dashed py-12">
            <EmptyHeader>
              <EmptyTitle>No directories match</EmptyTitle>
              <EmptyDescription>Try a different search, or clear the filters.</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={clearFilters}>
              <XIcon data-icon="inline-start" aria-hidden="true" />
              Clear filters
            </Button>
          </Empty>
        ) : (
          <Table variant="pill" aria-labelledby="directories-table-title">
            <TableHeader>
              <TableRow>
                <TableHead>Directory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Checklist</TableHead>
                <TableHead className="hidden sm:table-cell">Date submitted</TableHead>
                <TableHead className="hidden lg:table-cell">Priority</TableHead>
                <TableHead className="hidden xl:table-cell">Listing</TableHead>
                <TableHead className="w-12 px-1! sm:px-2!">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDirectories.map((directory) => {
                const isSelected = selectedDirectoryId === directory.id;
                const progress = checklistProgress(directory.id);
                return (
                  <TableRow
                    key={directory.id}
                    data-state={isSelected ? "selected" : undefined}
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => setSelectedDirectoryId(directory.id)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedDirectoryId(directory.id);
                      }
                    }}
                    className="cursor-pointer outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring data-[state=selected]:bg-transparent data-[state=selected]:hover:bg-accent/45"
                  >
                    <TableCell>
                      <div className="flex w-[150px] min-w-0 items-center gap-2.5 sm:w-[260px] sm:gap-3 2xl:w-[320px]">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "hidden size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold min-[420px]:flex",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-accent text-primary-deep"
                          )}
                        >
                          {directory.name.trim()[0]?.toUpperCase() ?? "?"}
                        </span>
                        <div className="min-w-0">
                          <p className="m-0 truncate font-semibold text-foreground" title={directory.name}>
                            {directory.name}
                          </p>
                          <div className="flex min-w-0 items-center gap-1.5">
                            <a
                              className="min-w-0 truncate text-xs text-muted-foreground hover:text-primary-deep hover:underline"
                              href={websiteHref(directory.website)}
                              rel="noreferrer"
                              target="_blank"
                              title={directory.website}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {directory.website}
                            </a>
                            {directory.status === "Not submitted" && (
                              <Badge variant="secondary" className="h-5 shrink-0 px-2 text-[11px]">
                                Suggested
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DirectoryStatusBadge status={directory.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openChecklistFor(directory.id)}
                        aria-label={`Submission checklist for ${directory.name}: ${progress.done} of ${progress.total} ready`}
                        className="group/check -mx-2 flex items-center gap-2.5 rounded-full px-2 py-1 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {progress.done === progress.total ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                            <CheckIcon className="size-3.5" strokeWidth={3} aria-hidden="true" />
                            Ready
                          </span>
                        ) : (
                          <>
                            <span className="h-1.5 w-14 overflow-hidden rounded-full bg-chart-track" aria-hidden="true">
                              <span
                                className="block h-full rounded-full bg-primary"
                                style={{ width: `${(progress.done / progress.total) * 100}%` }}
                              />
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground tabular-nums group-hover/check:text-accent-foreground">
                              {progress.done}/{progress.total}
                            </span>
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatSubmittedDate(directory.dateSubmitted)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span
                        className={cn(
                          "inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold",
                          priorityStyles[directory.priority]
                        )}
                      >
                        {directory.priority}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {directory.listingUrl ? (
                        <a
                          className="inline-flex items-center gap-1 font-semibold text-primary-deep hover:underline"
                          href={directory.listingUrl}
                          rel="noreferrer"
                          target="_blank"
                          title={directory.listingUrl}
                          onClick={(event) => event.stopPropagation()}
                        >
                          View listing
                          <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-faint-foreground">Not yet</span>
                      )}
                    </TableCell>
                    <TableCell className="px-1! text-right sm:px-2!" onClick={(event) => event.stopPropagation()}>
                      <ActionMenu
                        directory={directory}
                        openEditDirectory={openEditDirectory}
                        openChecklist={(dir) => openChecklistFor(dir.id)}
                        deleteDirectory={deleteDirectory}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

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
                      setEditForm({
                        ...editForm,
                        listingUrl: event.target.value,
                      })
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
      <SubmissionChecklistDialog
        open={isChecklistOpen}
        onOpenChange={setIsChecklistOpen}
        customItems={customChecklistItems}
        onCustomItemsChange={setCustomChecklistItems}
      />
    </>
  );
}
