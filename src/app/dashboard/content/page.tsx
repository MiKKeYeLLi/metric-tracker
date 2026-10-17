"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type Status = "Idea" | "Published" | "Draft" | "Scheduled" | "Archived";
type ContentType = "Article" | "Social post" | "Video" | "Newsletter";
type Topic = string;

type ContentRow = {
  id: string;
  title: string;
  url: string;
  type: ContentType;
  topics: Topic[];
  status: Status;
  created: string;
  updated: string;
  viewsLast30: number;
  notes: string;
  platform?: string;
  publishDate?: string;
  totalViews?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  summary?: string;
  showOnPublicPage?: boolean;
  featureThisPiece?: boolean;
};

type ContentApiItem = {
  id: string;
  title: string;
  url: string;
  type: ContentType;
  platform: string;
  topics: string[];
  status: Status;
  createdDate: string;
  publishDate: string | null;
  updatedDate: string | null;
  notes: string | null;
};

function statusClassName(status: Status) {
  if (status === "Published") return "bg-success-muted text-success";
  if (status === "Draft") return "bg-warning-muted text-warning";
  if (status === "Scheduled") return "bg-info-muted text-info";
  return "bg-secondary text-secondary-foreground";
}

function parseDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function dateInputValue(value: string) {
  if (!value || value === "-") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "";
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForRow(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function contentItemToRow(item: ContentApiItem): ContentRow {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    type: item.type,
    platform: item.platform,
    topics: item.topics,
    status: item.status,
    created: formatDateForRow(item.createdDate),
    updated: formatDateForRow(item.updatedDate ?? item.publishDate ?? ""),
    publishDate: item.publishDate ?? undefined,
    viewsLast30: 0,
    notes: item.notes ?? "No notes added",
  };
}

export default function ContentTrackerPage() {
  const [rowsState, setRowsState] = useState<ContentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentRow | null>(null);
  const [formError, setFormError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    url: "",
    type: "article",
    platform: "website",
    tags: ["Topic A", "Topic B"],
    status: "Draft" as Status,
    created: "",
    publishDate: "",
    updated: "",
    totalViews: "0",
    viewsLast30: "0",
    likes: "0",
    shares: "0",
    comments: "0",
    summary: "",
    notes: "",
    showOnPublicPage: true,
    featureThisPiece: true,
  });

  useEffect(() => {
    let isCurrent = true;

    async function loadContent() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/content", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load content. Please try again.");
        const items = (await response.json()) as ContentApiItem[];
        if (isCurrent) setRowsState(items.map(contentItemToRow));
      } catch (error) {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : "Could not load content. Please try again.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadContent();
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setFormError("");
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setTagInput("");
    setForm({
      title: "",
      url: "",
      type: "article",
      platform: "website",
      tags: ["Topic A", "Topic B"],
      status: "Draft",
      created: "",
      publishDate: "",
      updated: "",
      totalViews: "0",
      viewsLast30: "0",
      likes: "0",
      shares: "0",
      comments: "0",
      summary: "",
      notes: "",
      showOnPublicPage: true,
      featureThisPiece: true,
    });
  };

  const openAddDialog = () => {
    setEditingId(null);
    resetForm();
    setFormError("");
    setIsOpen(true);
  };

  const openEditDialog = (row: ContentRow) => {
    const type =
      row.type === "Article"
        ? "article"
        : row.type === "Social post"
          ? "social"
          : row.type === "Video"
            ? "video"
            : "newsletter";
    const platform =
      row.platform ??
      (row.url.includes("linkedin")
        ? "linkedin"
        : row.url.includes("instagram")
          ? "instagram"
          : row.url.includes("youtube")
            ? "youtube"
            : "website");

    setEditingId(row.id);
    setForm({
      title: row.title,
      url: row.url,
      type,
      platform,
      tags: [...row.topics],
      status: row.status,
      created: dateInputValue(row.created),
      publishDate: dateInputValue(row.publishDate ?? ""),
      updated: dateInputValue(row.updated),
      totalViews: String(row.totalViews ?? 0),
      viewsLast30: String(row.viewsLast30),
      likes: String(row.likes ?? 0),
      shares: String(row.shares ?? 0),
      comments: String(row.comments ?? 0),
      summary: row.summary ?? "",
      notes: row.notes === "No notes added" ? "" : row.notes,
      showOnPublicPage: row.showOnPublicPage ?? true,
      featureThisPiece: row.featureThisPiece ?? true,
    });
    setTagInput("");
    setFormError("");
    setIsOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/content/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete content. Please try again.");
      setRowsState((previous) => previous.filter((row) => row.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete content. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTag = (tag: Topic) => {
    setForm((previous) => ({
      ...previous,
      tags: previous.tags.includes(tag)
        ? previous.tags.filter((value) => value !== tag)
        : [...previous.tags, tag],
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    setForm((previous) => ({
      ...previous,
      tags: previous.tags.some((value) => value.toLocaleLowerCase() === tag.toLocaleLowerCase())
        ? previous.tags
        : [...previous.tags, tag],
    }));
    setTagInput("");
  };

  const saveContent = async (keepOpen: boolean) => {
    if (!form.title.trim() || !form.url.trim() || !form.created.trim()) {
      setFormError("Complete the required title, link, and date created fields before saving.");
      return;
    }

    const normalizedType =
      form.type === "article"
        ? "Article"
        : form.type === "social"
          ? "Social post"
          : form.type === "video"
            ? "Video"
            : "Newsletter";

    const payload = {
      title: form.title.trim(),
      url: form.url.trim(),
      type: normalizedType,
      platform: form.platform,
      topics: [...form.tags],
      status: form.status,
      createdDate: form.created,
      publishDate: form.publishDate || null,
      updatedDate: form.updated || null,
      notes: form.notes.trim() || null,
    };

    setIsSaving(true);
    setFormError("");
    try {
      const response = await fetch(editingId ? `/api/content/${editingId}` : "/api/content", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseBody = (await response.json().catch(() => null)) as
        | ContentApiItem
        | { error?: string; details?: Record<string, string[]> }
        | null;
      if (!response.ok) {
        const validationMessage = responseBody && "details" in responseBody
          ? Object.values(responseBody.details ?? {}).flat()[0]
          : undefined;
        throw new Error(validationMessage ?? (responseBody && "error" in responseBody ? responseBody.error : undefined) ?? "Could not save content. Please try again.");
      }

      const savedRow = contentItemToRow(responseBody as ContentApiItem);
      if (editingId) {
        setRowsState((previous) => previous.map((row) => (row.id === editingId ? savedRow : row)));
      } else {
        setRowsState((previous) => [savedRow, ...previous]);
      }

      if (keepOpen && !editingId) {
        resetForm();
      } else {
        resetForm();
        setEditingId(null);
        setIsOpen(false);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save content. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRows = rowsState
    .filter((row) => {
      const query = searchQuery.trim().toLocaleLowerCase();
      const matchesSearch =
        !query ||
        [row.title, row.url, row.type, row.topics.join(" "), row.status, row.notes]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query);
      const rowTypeFilter = row.type === "Social post" ? "social" : row.type.toLocaleLowerCase();
      const matchesType = typeFilter === "all" || rowTypeFilter === typeFilter;
      const matchesTopic = topicFilter === "all" || row.topics.includes(topicFilter as Topic);
      const matchesStatus = statusFilter === "all" || row.status.toLocaleLowerCase() === statusFilter;
      return matchesSearch && matchesType && matchesTopic && matchesStatus;
    })
    .sort((first, second) => {
      const dateDifference = parseDate(first.created) - parseDate(second.created);
      return sortOrder === "newest" ? -dateDifference : dateDifference;
    });
  const availableTopics = Array.from(new Set(rowsState.flatMap((row) => row.topics))).sort();

  const stats = [
    { label: "Total pieces", value: rowsState.length.toLocaleString() },
    {
      label: "Published",
      value: rowsState.filter((row) => row.status === "Published").length.toLocaleString(),
    },
    {
      label: "Drafts & scheduled",
      value: rowsState.filter((row) => row.status === "Draft" || row.status === "Scheduled").length.toLocaleString(),
    },
    {
      label: "Views, last 30 days",
      value: rowsState.reduce((total, row) => total + row.viewsLast30, 0).toLocaleString(),
    },
  ];

  const hasActiveFilters =
    searchQuery !== "" ||
    typeFilter !== "all" ||
    topicFilter !== "all" ||
    statusFilter !== "all" ||
    sortOrder !== "newest";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setTopicFilter("all");
    setStatusFilter("all");
    setSortOrder("newest");
  };

  return (
    <div className="px-[clamp(20px,4vw,36px)] py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Private • Only visible to me
          </p>
          <h1 className="m-0 text-[clamp(2.2rem,3vw,4rem)] font-extrabold tracking-[-0.05em] text-foreground">
            Content Tracker
          </h1>
        </div>

        <Button size="lg" onClick={openAddDialog} className="h-11 rounded-lg bg-[#2d6e63] px-4 text-sm font-semibold text-white hover:bg-[#285d54]">
          <Plus className="mr-2 size-4" />
          Add content
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <p className="mb-2 text-[13px] font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-[clamp(1.8rem,2vw,3rem)] font-bold tracking-[-0.04em] text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{loadError}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey((value) => value + 1)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-5 flex flex-col gap-3 border border-border bg-card px-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-none">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search titles, topics, notes"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search titles, topics, notes"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <NativeSelect aria-label="Filter by content type" className="w-full sm:w-[140px]" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">Type: All</option>
            <option value="article">Article</option>
            <option value="social">Social post</option>
            <option value="video">Video</option>
            <option value="newsletter">Newsletter</option>
          </NativeSelect>

          <NativeSelect aria-label="Filter by topic" className="w-full sm:w-[140px]" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
            <option value="all">Topic: All</option>
            {availableTopics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </NativeSelect>

          <NativeSelect aria-label="Filter by status" className="w-full sm:w-[140px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Status: All</option>
            <option value="idea">Idea</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </NativeSelect>

          <NativeSelect aria-label="Sort content by created date" className="w-full sm:w-[150px]" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Oldest</option>
          </NativeSelect>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-10 justify-start px-2 sm:justify-center">
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="bg-muted/60">
            <tr>
              {[
                "Title / link",
                "Type",
                "Topic",
                "Status",
                "Created",
                "Updated",
                "Notes",
              ].map((heading) => (
                <th
                  key={heading}
                  className="border-b border-border px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {heading}
                </th>
              ))}
              <th aria-label="Row actions" className="w-12 border-b border-border" />
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, index) => (
              <tr
                key={`${row.title}-${index}`}
                className="transition-colors hover:bg-primary/4"
              >
                <td className="border-b border-border px-3 py-3 align-top">
                  <div className="font-medium text-foreground">{row.title}</div>
                  <div className="text-[12px] text-muted-foreground">{row.url}</div>
                </td>
                <td className="border-b border-border px-3 py-3 text-[13px] text-foreground">{row.type}</td>
                <td className="border-b border-border px-3 py-3 text-[13px] text-foreground">{row.topics.length ? row.topics.join(", ") : "-"}</td>
                <td className="border-b border-border px-3 py-3">
                  <Badge className={cn("h-6 rounded-full px-2.5 text-[11px] font-medium", statusClassName(row.status))}>
                    {row.status}
                  </Badge>
                </td>
                <td className="border-b border-border px-3 py-3 text-[13px] text-foreground">{row.created}</td>
                <td className="border-b border-border px-3 py-3 text-[13px] text-foreground">{row.updated}</td>
                <td className="border-b border-border px-3 py-3 text-[13px] text-foreground">{row.notes}</td>
                <td className="border-b border-border px-2 py-2 text-right align-top">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      type="button"
                      aria-label={`Actions for ${row.title}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
                    >
                      <MoreVertical aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onSelect={() => openEditDialog(row)}>
                        <Pencil aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(row)}>
                        <Trash2 aria-hidden="true" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={8} className="p-0">
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                    <Spinner />
                    Loading content...
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !loadError && filteredRows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-0">
                  <Empty className="rounded-none border-0 py-12">
                    <EmptyHeader>
                      <EmptyTitle>{rowsState.length === 0 ? "No content yet" : "No content found"}</EmptyTitle>
                      <EmptyDescription>
                        {rowsState.length === 0 ? "Add content to get started." : "Try changing your search or filters."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 text-[12px] text-muted-foreground">
        {rowsState.length} saved {rowsState.length === 1 ? "piece" : "pieces"}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingId(null);
            setFormError("");
          }
        }}
      >
        <DialogContent className={cn("max-h-[calc(100vh-48px)] w-[min(760px,calc(100%-32px))] overflow-y-auto rounded-xl border border-border bg-card p-0 shadow-[0_18px_40px_rgba(26,25,23,0.15)] sm:max-w-[760px]", editingId && "sm:max-w-[640px]")}>
          <DialogHeader className="px-6 pt-6 pb-3">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2 text-[22px] font-bold tracking-[-0.03em] text-foreground">
                {editingId && <Pencil aria-hidden="true" className="size-4" />}
                {editingId ? "Edit content" : "Add content"}
              </DialogTitle>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {editingId
                ? "Update the details for this content. Fields marked * are required."
                : "Log a new piece in your tracker. Fields marked * are required."}
            </p>
          </DialogHeader>

          <div className="px-6 pb-2">
            {formError && (
              <p role="alert" className="mb-4 text-sm text-destructive">
                {formError}
              </p>
            )}
            <div className="space-y-6">
              <section className="space-y-4 border-b border-border pb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Details</p>

                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-foreground">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="title"
                    className="h-10.5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-foreground">
                    Link (URL) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.url}
                    onChange={(event) => updateField("url", event.target.value)}
                    placeholder="https://"
                    className="h-10.5"
                  />
                  <p className="text-[11px] text-muted-foreground">Where the piece lives, on your site or a social platform</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold text-foreground">
                      Content type <span className="text-destructive">*</span>
                    </label>
                    <NativeSelect
                      className="w-full"
                      value={form.type}
                      onChange={(event) => updateField("type", event.target.value)}
                    >
                      <option value="article">Article</option>
                      <option value="social">Social post</option>
                      <option value="video">Video</option>
                      <option value="newsletter">Newsletter</option>
                    </NativeSelect>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold text-foreground">
                      Platform or source <span className="text-destructive">*</span>
                    </label>
                    <NativeSelect
                      className="w-full"
                      value={form.platform}
                      onChange={(event) => updateField("platform", event.target.value)}
                    >
                      <option value="website">Own website</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                    </NativeSelect>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-foreground">Topics or tags</label>
                  <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-input bg-background px-2 py-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-accent py-1 pl-2.5 pr-1 text-[11px] font-medium text-primary-deep"
                      >
                        {tag}
                        <button
                          type="button"
                          aria-label={`Remove ${tag}`}
                          title={`Remove ${tag}`}
                          onClick={() => toggleTag(tag)}
                          className="inline-flex size-6 items-center justify-center rounded-full transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X aria-hidden="true" className="size-3.5" />
                        </button>
                      </span>
                    ))}
                    <Input
                      aria-label="Add a topic or tag"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add a topic and press Enter"
                      className="h-7 min-w-[190px] flex-1 border-0 bg-transparent px-1 py-0 text-[13px] shadow-none focus-visible:bg-transparent focus-visible:ring-0"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Used for filtering on both pages</p>
                </div>
              </section>

              <section className="space-y-4 border-b border-border pb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Status and dates</p>
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-foreground">Status <span className="text-destructive">*</span></label>
                  <div className="grid grid-cols-5 overflow-hidden rounded-lg border border-border bg-background">
                    {[
                      { label: "Idea", value: "Idea" },
                      { label: "Draft", value: "Draft" },
                      { label: "Scheduled", value: "Scheduled" },
                      { label: "Published", value: "Published" },
                      { label: "Archived", value: "Archived" },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        aria-pressed={form.status === option.value}
                        onClick={() => updateField("status", option.value as Status)}
                        className={cn(
                          "border-r border-border px-3 py-2 text-[12px] transition-colors last:border-r-0",
                          form.status === option.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold text-foreground">
                      Date created <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="date"
                      value={form.created}
                      onChange={(event) => updateField("created", event.target.value)}
                      className="h-10.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold text-foreground">Publish or scheduled date</label>
                    <Input
                      type="date"
                      value={form.publishDate}
                      onChange={(event) => updateField("publishDate", event.target.value)}
                      className="h-10.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[12px] font-semibold text-foreground">Last updated</label>
                    <Input
                      type="date"
                      value={form.updated}
                      onChange={(event) => updateField("updated", event.target.value)}
                      className="h-10.5"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">Leave empty for drafts.</p>
              </section>

              <section className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Notes</p>

                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-foreground">Private notes</label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="Ideas to reuse, follow-ups, reminders. Only you see this."
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15"
                  />
                </div>

              </section>
            </div>
          </div>

          <DialogFooter className="mt-0 border-t border-border bg-muted/40 px-6 py-4">
            <div className="flex w-full items-center justify-end gap-3">
              <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setIsOpen(false)} className="h-10 rounded-lg px-4 text-sm font-medium">
                Cancel
              </Button>
              {!editingId && (
                <Button type="button" variant="outline" disabled={isSaving} onClick={() => saveContent(true)} className="h-10 rounded-lg px-4 text-sm font-medium">
                  Save and add another
                </Button>
              )}
              <Button type="button" disabled={isSaving} onClick={() => saveContent(false)} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
                {isSaving && <Spinner data-icon="inline-start" />}
                {isSaving ? "Saving..." : editingId ? "Save changes" : "Save content"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive-muted text-destructive">
              <Trash2 aria-hidden="true" className="size-5" />
            </div>
            <DialogTitle className="text-xl">Delete content?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this content? This action cannot be undone. The content will be permanently removed from your tracker.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          {deleteTarget && (
            <div className="rounded-lg border border-destructive/20 bg-destructive-muted/40 px-4 py-3">
              <p className="font-semibold text-foreground">{deleteTarget.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{deleteTarget.url}</p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={isDeleting} onClick={confirmDelete}>
              {isDeleting ? <Spinner data-icon="inline-start" /> : <Trash2 aria-hidden="true" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
