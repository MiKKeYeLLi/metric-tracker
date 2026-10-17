"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DownloadIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  FileTextIcon,
  Link2Icon,
  NewspaperIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RecordType = "Press Coverage" | "Press Submission";
type ArticleType =
  | "News Article"
  | "Interview"
  | "Feature Story"
  | "Press Release"
  | "Opinion / Commentary"
  | "Partner / Sponsored Content"
  | "Broadcast / Podcast Appearance"
  | "Other";
type SubmissionStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Changes Requested"
  | "Accepted"
  | "Published"
  | "Rejected"
  | "Withdrawn";

type PressRecord = {
  id: string;
  recordType: RecordType;
  articleType: ArticleType;
  articleTypeOther?: string;
  title: string;
  outlet: string;
  publicationDate?: string;
  dateSubmitted?: string;
  status: SubmissionStatus | "Published";
  responsiblePerson?: string;
  followUpDate?: string;
  articleUrl?: string;
  documentUrl?: string;
  notes?: string;
  linkedCoverageId?: string;
};

type FormValues = {
  recordType: RecordType | "";
  articleType: ArticleType | "";
  articleTypeOther: string;
  title: string;
  outlet: string;
  publicationDate: string;
  dateSubmitted: string;
  status: SubmissionStatus | "";
  responsiblePerson: string;
  followUpDate: string;
  articleUrl: string;
  documentUrl: string;
  notes: string;
};

const ARTICLE_TYPES: ArticleType[] = [
  "News Article",
  "Interview",
  "Feature Story",
  "Press Release",
  "Opinion / Commentary",
  "Partner / Sponsored Content",
  "Broadcast / Podcast Appearance",
  "Other",
];

const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Changes Requested",
  "Accepted",
  "Published",
  "Rejected",
  "Withdrawn",
];

const EMPTY_FORM: FormValues = {
  recordType: "Press Coverage",
  articleType: "",
  articleTypeOther: "",
  title: "",
  outlet: "",
  publicationDate: "",
  dateSubmitted: "",
  status: "Draft",
  responsiblePerson: "",
  followUpDate: "",
  articleUrl: "",
  documentUrl: "",
  notes: "",
};

const formattedToday = new Date().toISOString().slice(0, 10);

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = parseDate(value);
  if (!parsed) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function getSummaryVariant(status: SubmissionStatus | "Published") {
  switch (status) {
    case "Published":
    case "Accepted":
      return "success";
    case "Under Review":
    case "Submitted":
    case "Changes Requested":
      return "warning";
    case "Rejected":
    case "Withdrawn":
      return "destructive";
    case "Draft":
      return "secondary";
    default:
      return "secondary";
  }
}

function toFormValues(record?: PressRecord): FormValues {
  if (!record) {
    return { ...EMPTY_FORM };
  }

  return {
    recordType: record.recordType,
    articleType: record.articleType,
    articleTypeOther: record.articleTypeOther ?? "",
    title: record.title,
    outlet: record.outlet,
    publicationDate: record.publicationDate ?? "",
    dateSubmitted: record.dateSubmitted ?? "",
    status: record.recordType === "Press Submission" ? (record.status as SubmissionStatus) : "Published",
    responsiblePerson: record.responsiblePerson ?? "",
    followUpDate: record.followUpDate ?? "",
    articleUrl: record.articleUrl ?? "",
    documentUrl: record.documentUrl ?? "",
    notes: record.notes ?? "",
  };
}

function getRecordDate(record: PressRecord) {
  if (record.recordType === "Press Coverage") {
    return record.publicationDate;
  }

  return record.dateSubmitted;
}

async function readRecords(): Promise<PressRecord[]> {
  const response = await fetch("/api/media", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load media records.");
  }
  const data = (await response.json()) as { records?: PressRecord[] };
  return Array.isArray(data.records) ? data.records : [];
}

export function PressMediaDashboard() {
  const [records, setRecords] = useState<PressRecord[]>([]);
  const [selectedTab, setSelectedTab] = useState<"all" | "coverage" | "submissions">("all");
  const [search, setSearch] = useState("");
  const [recordTypeFilter, setRecordTypeFilter] = useState<"all" | RecordType>("all");
  const [articleTypeFilter, setArticleTypeFilter] = useState<ArticleType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusTargetId, setStatusTargetId] = useState<string | null>(null);
  const [linkTargetId, setLinkTargetId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PressRecord | null>(null);
  const [linkedCoverageId, setLinkedCoverageId] = useState("");
  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const nextRecords = await readRecords();
      setRecords(nextRecords);
    } catch (error) {
      setRecords([]);
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load media records.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return records.filter((record) => {
      const tabMatches =
        selectedTab === "all" ||
        (selectedTab === "coverage" && record.recordType === "Press Coverage") ||
        (selectedTab === "submissions" && record.recordType === "Press Submission");

      const recordTypeMatches =
        recordTypeFilter === "all" || record.recordType === recordTypeFilter;

      const articleTypeMatches =
        articleTypeFilter === "all" || record.articleType === articleTypeFilter;

      const statusMatches =
        statusFilter === "all" ||
        (record.recordType === "Press Submission" && record.status === statusFilter);

      const searchMatches =
        !searchTerm ||
        record.title.toLowerCase().includes(searchTerm) ||
        record.outlet.toLowerCase().includes(searchTerm);

      const dateValue = getRecordDate(record);
      const fromMatch = !dateFrom || !dateValue || dateValue >= dateFrom;
      const toMatch = !dateTo || !dateValue || dateValue <= dateTo;

      return (
        tabMatches &&
        recordTypeMatches &&
        articleTypeMatches &&
        statusMatches &&
        searchMatches &&
        fromMatch &&
        toMatch
      );
    });
  }, [articleTypeFilter, dateFrom, dateTo, records, recordTypeFilter, search, selectedTab, statusFilter]);

  const totalCoverage = useMemo(
    () => records.filter((record) => record.recordType === "Press Coverage").length,
    [records],
  );

  const activeSubmissions = useMemo(
    () =>
      records.filter(
        (record) =>
          record.recordType === "Press Submission" &&
          !["Rejected", "Withdrawn", "Published"].includes(record.status),
      ).length,
    [records],
  );

  const currentYear = new Date().getFullYear();

  const publishedThisYear = useMemo(
    () =>
      records.filter((record) => {
        const publicationDate =
          record.recordType === "Press Coverage"
            ? record.publicationDate
            : record.status === "Published"
              ? record.publicationDate ?? record.dateSubmitted
              : null;

        if (!publicationDate) return false;
        const parsed = parseDate(publicationDate);
        return parsed ? parsed.getFullYear() === currentYear : false;
      }).length,
    [currentYear, records],
  );

  const followUpsDue = useMemo(
    () =>
      records.filter((record) => {
        if (record.recordType !== "Press Submission" || !record.followUpDate) return false;
        const parsed = parseDate(record.followUpDate);
        if (!parsed) return false;
        return parsed <= new Date(formattedToday) && !["Published", "Rejected", "Withdrawn"].includes(record.status);
      }).length,
    [records],
  );

  const coverageOptions = records.filter((record) => record.recordType === "Press Coverage");

  const clearFilters = () => {
    setSearch("");
    setRecordTypeFilter("all");
    setArticleTypeFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleOpenNewRecord = () => {
    setEditingId(null);
    setFormValues({ ...EMPTY_FORM, recordType: "Press Coverage" });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleEditRecord = (record: PressRecord) => {
    setEditingId(record.id);
    setFormValues(toFormValues(record));
    setFormErrors({});
    setIsFormOpen(true);
  };

  const updateFormValue = <Key extends keyof FormValues>(field: Key, value: FormValues[Key]) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateForm = () => {
    const errors: Partial<Record<string, string>> = {};

    if (!formValues.recordType) {
      errors.recordType = "Select a record type.";
    }

    if (!formValues.title.trim()) {
      errors.title = "Article title is required.";
    }

    if (!formValues.outlet.trim()) {
      errors.outlet = "Media outlet is required.";
    }

    if (!formValues.articleType) {
      errors.articleType = "Choose an article type.";
    }

    if (formValues.articleType === "Other" && !formValues.articleTypeOther.trim()) {
      errors.articleTypeOther = "Describe the other article type.";
    }

    if (formValues.recordType === "Press Coverage" && !formValues.articleUrl.trim()) {
      errors.articleUrl = "Published article URL is required.";
    }

    if (formValues.recordType === "Press Submission") {
      if (!formValues.dateSubmitted) {
        errors.dateSubmitted = "Date submitted is required.";
      }

      if (!formValues.status) {
        errors.status = "Status is required.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitRecord = async () => {
    if (!validateForm()) {
      setFeedback({ type: "error", message: "Please fix the highlighted fields before saving." });
      return;
    }

    const payload = {
      recordType: formValues.recordType,
      articleType: formValues.articleType,
      articleTypeOther: formValues.articleTypeOther,
      title: formValues.title,
      outlet: formValues.outlet,
      publicationDate: formValues.publicationDate,
      dateSubmitted: formValues.dateSubmitted,
      status: formValues.status,
      responsiblePerson: formValues.responsiblePerson,
      followUpDate: formValues.followUpDate,
      articleUrl: formValues.articleUrl,
      documentUrl: formValues.documentUrl,
      notes: formValues.notes,
    };

    try {
      if (editingId) {
        const response = await fetch(`/api/media/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error ?? "Unable to update record.");
        }
        setFeedback({ type: "success", message: "Record updated successfully." });
      } else {
        const response = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error ?? "Unable to create record.");
        }
        setFeedback({ type: "success", message: "Record added successfully." });
      }

      setIsFormOpen(false);
      setEditingId(null);
      setFormValues({ ...EMPTY_FORM, recordType: "Press Coverage" });
      await loadRecords();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save the record.",
      });
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/media/${recordId}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Unable to delete record.");
      }
      setFeedback({ type: "success", message: "Record deleted." });
      await loadRecords();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete record.",
      });
    }
  };

  const handleStatusUpdate = (recordId: string) => {
    setStatusTargetId(recordId);
    const record = records.find((item) => item.id === recordId);
    if (!record) return;
    setFormValues((current) => ({ ...current, status: record.status as SubmissionStatus }));
    setIsStatusDialogOpen(true);
  };

  const saveStatusUpdate = async () => {
    if (!statusTargetId) return;

    try {
      const response = await fetch(`/api/media/${statusTargetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...toFormValues(records.find((record) => record.id === statusTargetId)),
          status: formValues.status,
          articleType: records.find((record) => record.id === statusTargetId)?.articleType ?? "News Article",
          title: records.find((record) => record.id === statusTargetId)?.title ?? "",
          outlet: records.find((record) => record.id === statusTargetId)?.outlet ?? "",
          recordType: "Press Submission",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Unable to update status.");
      }

      setIsStatusDialogOpen(false);
      setStatusTargetId(null);
      setFeedback({ type: "success", message: "Submission status updated." });
      await loadRecords();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update status.",
      });
    }
  };

  const handleLinkCoverage = (recordId: string) => {
    const record = records.find((item) => item.id === recordId);
    if (!record || record.recordType !== "Press Submission") return;
    setLinkTargetId(recordId);
    setLinkedCoverageId(record.linkedCoverageId ?? "");
    setIsLinkDialogOpen(true);
  };

  const saveLinkedCoverage = async () => {
    if (!linkTargetId) return;

    try {
      const record = records.find((item) => item.id === linkTargetId);
      const response = await fetch(`/api/media/${linkTargetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...toFormValues(record),
          linkedCoverageId,
          articleType: record?.articleType ?? "News Article",
          title: record?.title ?? "",
          outlet: record?.outlet ?? "",
          recordType: "Press Submission",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Unable to link coverage.");
      }

      setIsLinkDialogOpen(false);
      setLinkTargetId(null);
      setFeedback({ type: "success", message: "Coverage link saved." });
      await loadRecords();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to link coverage.",
      });
    }
  };

  const exportCsv = () => {
    if (!filteredRecords.length) {
      setFeedback({ type: "error", message: "No records match the current filters for export." });
      return;
    }

    const headers = [
      "Title",
      "Media Outlet",
      "Article Type",
      "Record Type",
      "Status",
      "Date",
      "Follow-up Date",
      "Publication URL",
      "Document URL",
      "Notes",
    ];

    const csvRows = filteredRecords.map((record) => {
      const dateValue = getRecordDate(record) ?? "";
      return [
        record.title,
        record.outlet,
        record.articleType === "Other" ? `${record.articleType} (${record.articleTypeOther ?? ""})` : record.articleType,
        record.recordType,
        record.status,
        dateValue,
        record.followUpDate ?? "",
        record.articleUrl ?? "",
        record.documentUrl ?? "",
        record.notes ?? "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "press-media-tracking.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback({ type: "success", message: "CSV export downloaded." });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Media desk
          </p>
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-3xl">
              Press &amp; Media Tracking
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage media coverage and track press submissions in one place.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={exportCsv}>
            <DownloadIcon data-icon="inline-start" aria-hidden="true" />
            Export
          </Button>
          <Button onClick={handleOpenNewRecord}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add Record
          </Button>
        </div>
      </header>

      {feedback ? (
        <Alert variant={feedback.type === "error" ? "destructive" : undefined} className="border border-border bg-card">
          <AlertTitle>{feedback.type === "error" ? "Action required" : "Saved"}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Total Coverage</p>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[-0.05em] text-foreground">{totalCoverage}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Active Submissions</p>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[-0.05em] text-foreground">{activeSubmissions}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Published This Year</p>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[-0.05em] text-foreground">{publishedThisYear}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Follow-ups Due</p>
          <p className="mt-3 font-mono text-3xl font-bold tracking-[-0.05em] text-foreground">{followUpsDue}</p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "all" | "coverage" | "submissions")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <TabsList variant="line" className="w-full justify-start lg:w-auto">
                <TabsTrigger value="all">All Records</TabsTrigger>
                <TabsTrigger value="coverage">Press Coverage</TabsTrigger>
                <TabsTrigger value="submissions">Press Submissions</TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1 lg:min-w-[260px]">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    aria-label="Search article title or media outlet"
                    className="pl-9"
                    placeholder="Search title or outlet"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                {(search || recordTypeFilter !== "all" || articleTypeFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Reset filters
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field className="min-w-0">
                <FieldLabel>Record type</FieldLabel>
                <NativeSelect value={recordTypeFilter} onChange={(event) => setRecordTypeFilter(event.target.value as "all" | RecordType)}>
                  <NativeSelectOption value="all">All</NativeSelectOption>
                  <NativeSelectOption value="Press Coverage">Press Coverage</NativeSelectOption>
                  <NativeSelectOption value="Press Submission">Press Submissions</NativeSelectOption>
                </NativeSelect>
              </Field>

              <Field className="min-w-0">
                <FieldLabel>Article type</FieldLabel>
                <NativeSelect value={articleTypeFilter} onChange={(event) => setArticleTypeFilter(event.target.value as ArticleType | "all")}>
                  <NativeSelectOption value="all">All</NativeSelectOption>
                  {ARTICLE_TYPES.map((type) => (
                    <NativeSelectOption key={type} value={type}>
                      {type}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field className="min-w-0">
                <FieldLabel>Status</FieldLabel>
                <NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SubmissionStatus | "all")}>
                  <NativeSelectOption value="all">All</NativeSelectOption>
                  {SUBMISSION_STATUSES.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {status}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field className="min-w-0">
                <FieldLabel>Due date range</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    aria-label="Filter from date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                  <Input
                    type="date"
                    aria-label="Filter to date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </div>
              </Field>
            </div>

            <TabsContent value={selectedTab} className="mt-5">
              {isLoading ? (
                <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
                  Loading media records…
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
                  No records match the current filters.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article Title</TableHead>
                        <TableHead>Media Outlet</TableHead>
                        <TableHead>Article Type</TableHead>
                        <TableHead>Record Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Follow-up Date</TableHead>
                        <TableHead className="w-[52px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="max-w-[220px]">
                            <div className="flex flex-col gap-1">
                              <span className="truncate font-medium text-foreground">{record.title}</span>
                              {record.linkedCoverageId ? (
                                <span className="text-xs text-muted-foreground">
                                  Linked to {records.find((item) => item.id === record.linkedCoverageId)?.title ?? "coverage record"}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{record.outlet}</TableCell>
                          <TableCell>
                            {record.articleType === "Other" && record.articleTypeOther
                              ? `${record.articleType} — ${record.articleTypeOther}`
                              : record.articleType}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.recordType}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground">
                            {formatDate(getRecordDate(record))}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSummaryVariant(record.status)}>{record.status}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground">
                            {record.followUpDate ? formatDate(record.followUpDate) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${record.title}`}>
                                  <EllipsisVerticalIcon aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => { setSelectedRecord(record); setIsDetailDialogOpen(true); }}>
                                  <EyeIcon aria-hidden="true" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleEditRecord(record)}>
                                  <PencilIcon aria-hidden="true" />
                                  Edit record
                                </DropdownMenuItem>
                                {record.recordType === "Press Submission" ? (
                                  <>
                                    <DropdownMenuItem onSelect={() => handleStatusUpdate(record.id)}>
                                      <FileTextIcon aria-hidden="true" />
                                      Update submission status
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleLinkCoverage(record.id)}>
                                      <Link2Icon aria-hidden="true" />
                                      {record.linkedCoverageId ? "Relink coverage" : "Link to coverage"}
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
                                <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteRecord(record.id)}>
                                  <Trash2Icon aria-hidden="true" />
                                  Delete record
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-0">
          <div className="px-6 pt-6 pb-0">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit record" : "Add record"}</DialogTitle>
              <DialogDescription>
                Save a press coverage item or a media submission.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 pb-6 pt-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Record type</FieldLabel>
                <NativeSelect
                  value={formValues.recordType}
                  onChange={(event) => updateFormValue("recordType", event.target.value as RecordType)}
                  aria-invalid={Boolean(formErrors.recordType)}
                >
                  <NativeSelectOption value="">Select</NativeSelectOption>
                  <NativeSelectOption value="Press Coverage">Press Coverage</NativeSelectOption>
                  <NativeSelectOption value="Press Submission">Press Submission</NativeSelectOption>
                </NativeSelect>
                {formErrors.recordType ? <FieldError>{formErrors.recordType}</FieldError> : null}
              </Field>
            </FieldGroup>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={Boolean(formErrors.title)}>
                <FieldLabel>Article Title</FieldLabel>
                <Input
                  value={formValues.title}
                  onChange={(event) => updateFormValue("title", event.target.value)}
                  aria-invalid={Boolean(formErrors.title)}
                  placeholder="Article title"
                />
                {formErrors.title ? <FieldError>{formErrors.title}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(formErrors.outlet)}>
                <FieldLabel>Media Outlet</FieldLabel>
                <Input
                  value={formValues.outlet}
                  onChange={(event) => updateFormValue("outlet", event.target.value)}
                  aria-invalid={Boolean(formErrors.outlet)}
                  placeholder="Outlet name"
                />
                {formErrors.outlet ? <FieldError>{formErrors.outlet}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(formErrors.articleType)}>
                <FieldLabel>Article Type</FieldLabel>
                <NativeSelect
                  value={formValues.articleType}
                  onChange={(event) => updateFormValue("articleType", event.target.value as ArticleType | "")}
                  aria-invalid={Boolean(formErrors.articleType)}
                >
                  <NativeSelectOption value="">Select</NativeSelectOption>
                  {ARTICLE_TYPES.map((option) => (
                    <NativeSelectOption key={option} value={option}>
                      {option}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {formErrors.articleType ? <FieldError>{formErrors.articleType}</FieldError> : null}
              </Field>

              <Field>
                <FieldLabel>Responsible Person</FieldLabel>
                <Input
                  value={formValues.responsiblePerson}
                  onChange={(event) => updateFormValue("responsiblePerson", event.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </div>

            {formValues.articleType === "Other" ? (
              <Field data-invalid={Boolean(formErrors.articleTypeOther)}>
                <FieldLabel>Other article type description</FieldLabel>
                <Input
                  value={formValues.articleTypeOther}
                  onChange={(event) => updateFormValue("articleTypeOther", event.target.value)}
                  aria-invalid={Boolean(formErrors.articleTypeOther)}
                  placeholder="Describe the category"
                />
                {formErrors.articleTypeOther ? <FieldError>{formErrors.articleTypeOther}</FieldError> : null}
              </Field>
            ) : null}

            {formValues.recordType === "Press Coverage" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field data-invalid={Boolean(formErrors.articleUrl)}>
                  <FieldLabel>Published Article URL</FieldLabel>
                  <Input
                    type="url"
                    value={formValues.articleUrl}
                    onChange={(event) => updateFormValue("articleUrl", event.target.value)}
                    aria-invalid={Boolean(formErrors.articleUrl)}
                    placeholder="https://example.com/article"
                  />
                  {formErrors.articleUrl ? <FieldError>{formErrors.articleUrl}</FieldError> : null}
                </Field>

                <Field>
                  <FieldLabel>Publication Date</FieldLabel>
                  <Input
                    type="date"
                    value={formValues.publicationDate}
                    onChange={(event) => updateFormValue("publicationDate", event.target.value)}
                  />
                </Field>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Field data-invalid={Boolean(formErrors.dateSubmitted)}>
                  <FieldLabel>Date Submitted</FieldLabel>
                  <Input
                    type="date"
                    value={formValues.dateSubmitted}
                    onChange={(event) => updateFormValue("dateSubmitted", event.target.value)}
                    aria-invalid={Boolean(formErrors.dateSubmitted)}
                  />
                  {formErrors.dateSubmitted ? <FieldError>{formErrors.dateSubmitted}</FieldError> : null}
                </Field>

                <Field data-invalid={Boolean(formErrors.status)}>
                  <FieldLabel>Status</FieldLabel>
                  <NativeSelect
                    value={formValues.status}
                    onChange={(event) => updateFormValue("status", event.target.value as SubmissionStatus | "")}
                    aria-invalid={Boolean(formErrors.status)}
                  >
                    <NativeSelectOption value="">Select</NativeSelectOption>
                    {SUBMISSION_STATUSES.map((status) => (
                      <NativeSelectOption key={status} value={status}>
                        {status}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  {formErrors.status ? <FieldError>{formErrors.status}</FieldError> : null}
                </Field>

                <Field>
                  <FieldLabel>Follow-up Date</FieldLabel>
                  <Input
                    type="date"
                    value={formValues.followUpDate}
                    onChange={(event) => updateFormValue("followUpDate", event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Draft / Document URL</FieldLabel>
                  <Input
                    type="url"
                    value={formValues.documentUrl}
                    onChange={(event) => updateFormValue("documentUrl", event.target.value)}
                    placeholder="https://example.com/document"
                  />
                </Field>
              </div>
            )}

            {formValues.recordType === "Press Submission" ? (
              <Field>
                <FieldLabel>Published Article URL</FieldLabel>
                <Input
                  type="url"
                  value={formValues.articleUrl}
                  onChange={(event) => updateFormValue("articleUrl", event.target.value)}
                  placeholder="Optional until publication"
                />
              </Field>
            ) : null}

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Input
                value={formValues.notes}
                onChange={(event) => updateFormValue("notes", event.target.value)}
                placeholder="Summary / notes"
              />
            </Field>
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRecord}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update submission status</DialogTitle>
            <DialogDescription>Choose the latest status report from the outlet.</DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel>Status</FieldLabel>
            <NativeSelect
              value={formValues.status}
              onChange={(event) => updateFormValue("status", event.target.value as SubmissionStatus)}
            >
              {SUBMISSION_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {status}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveStatusUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link published submission to coverage</DialogTitle>
            <DialogDescription>
              Associate this published item with the matching coverage article.
            </DialogDescription>
          </DialogHeader>

          {coverageOptions.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              No coverage records exist yet. Create one first, then link it here.
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsLinkDialogOpen(false);
                  setIsFormOpen(true);
                  setEditingId(null);
                  setFormValues({ ...EMPTY_FORM, recordType: "Press Coverage" });
                }}
              >
                <NewspaperIcon aria-hidden="true" />
                Add coverage record
              </Button>
            </div>
          ) : (
            <Field>
              <FieldLabel>Coverage record</FieldLabel>
              <NativeSelect value={linkedCoverageId} onChange={(event) => setLinkedCoverageId(event.target.value)}>
                <NativeSelectOption value="">Select a coverage record</NativeSelectOption>
                {coverageOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.title} — {option.outlet}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            {coverageOptions.length > 0 ? (
              <Button onClick={saveLinkedCoverage}>Save link</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRecord?.title ?? "Record details"}</DialogTitle>
            <DialogDescription>{selectedRecord?.recordType}</DialogDescription>
          </DialogHeader>

          {selectedRecord ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground">Media outlet</span>
                <span>{selectedRecord.outlet}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground">Article type</span>
                <span>{selectedRecord.articleType === "Other" ? `${selectedRecord.articleType} (${selectedRecord.articleTypeOther ?? "Other"})` : selectedRecord.articleType}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground">Date</span>
                <span>{formatDate(getRecordDate(selectedRecord))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground">Status</span>
                <Badge variant={getSummaryVariant(selectedRecord.status)}>{selectedRecord.status}</Badge>
              </div>
              {selectedRecord.followUpDate ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground">Follow-up date</span>
                  <span>{formatDate(selectedRecord.followUpDate)}</span>
                </div>
              ) : null}
              {selectedRecord.articleUrl ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground">Article URL</span>
                  <a className="truncate text-primary underline underline-offset-4" href={selectedRecord.articleUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                </div>
              ) : null}
              {selectedRecord.documentUrl ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground">Document URL</span>
                  <a className="truncate text-primary underline underline-offset-4" href={selectedRecord.documentUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                </div>
              ) : null}
              {selectedRecord.linkedCoverageId ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground">Linked coverage</span>
                  <span>{records.find((record) => record.id === selectedRecord.linkedCoverageId)?.title ?? "Linked"}</span>
                </div>
              ) : null}
              {selectedRecord.notes ? (
                <div className="rounded-xl border bg-muted/20 p-3 text-sm text-foreground">
                  {selectedRecord.notes}
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
