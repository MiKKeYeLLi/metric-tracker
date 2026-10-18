"use client";

import { ChangeEvent, useRef, useState } from "react";
import { CheckIcon, PlusIcon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useDirectories } from "@/context/DirectoryContext";
import type { DirectoryItem, DirectoryStatus, Priority } from "@/types/directory";

interface AddDirectoryModalProps {
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
}

type FormState = {
  name: string;
  website: string;
  status: DirectoryStatus;
  priority: Priority;
  dateSubmitted: string;
  listingUrl: string;
  notes: string;
  addToChecklist: boolean;
};

const defaultFormState: FormState = {
  name: "",
  website: "",
  status: "Pending review",
  priority: "Medium",
  dateSubmitted: "",
  listingUrl: "",
  notes: "",
  addToChecklist: true,
};

const statusOptions: DirectoryStatus[] = [
  "Live",
  "Pending review",
  "Needs changes",
  "Rejected",
  "Not submitted",
];

const priorityOptions: Priority[] = ["High", "Medium", "Low"];

const quickAddPresets = [
  { name: "Product Hunt", website: "producthunt.com", status: "Pending review" as DirectoryStatus, priority: "High" as Priority },
  { name: "BetaList", website: "betalist.com", status: "Pending review" as DirectoryStatus, priority: "Medium" as Priority },
  { name: "Indie Hackers", website: "indiehackers.com", status: "Live" as DirectoryStatus, priority: "Medium" as Priority },
  { name: "G2", website: "g2.com", status: "Needs changes" as DirectoryStatus, priority: "High" as Priority },
  { name: "AlternativeTo", website: "alternativeto.net", status: "Live" as DirectoryStatus, priority: "Low" as Priority },
  { name: "SaaSHub", website: "saashub.com", status: "Pending review" as DirectoryStatus, priority: "Medium" as Priority },
];

function formatSubmittedDate(value: string) {
  if (!value) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeWebsite(value: string) {
  const nextValue = value.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return nextValue;
}

function generateDirectoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `dir-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function parseCsvValue(value: string) {
  return value.trim().replace(/^"|"$/g, "");
}

export function ImportCsvButton({
  className,
  label = "Import CSV",
}: {
  className?: string;
  label?: string;
}) {
  const { addDirectory } = useDirectories();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      event.target.value = "";
      return;
    }

    const rows = lines.slice(1).map((line) =>
      line.split(",").map((value) => parseCsvValue(value)),
    );

    const importRows = rows.length > 0 ? rows : [[...lines[0].split(",")]];

    importRows.forEach((row) => {
      const name = row[0]?.trim() || "Imported directory";
      const website = (row[1] || name).trim();
      const status = (row[2] as DirectoryStatus) || "Pending review";
      const priority = (row[3] as Priority) || "Medium";

      addDirectory({
        id: generateDirectoryId(),
        name,
        website: normalizeWebsite(website),
        status: statusOptions.includes(status) ? status : "Pending review",
        priority: priorityOptions.includes(priority) ? priority : "Medium",
        dateSubmitted: formatSubmittedDate(""),
        listingUrl: undefined,
        notes: "Imported from CSV.",
      });
    });

    event.target.value = "";
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        <UploadIcon className="size-4" aria-hidden="true" />
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImport}
      />
    </>
  );
}

export function AddDirectoryModal({
  triggerLabel = "Add directory",
  triggerVariant = "default",
}: AddDirectoryModalProps) {
  const { addDirectory } = useDirectories();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const handleFieldChange = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (form.name.trim().length < 2) {
      nextErrors.name = "Directory name is required.";
    }

    if (form.website.trim().length < 2) {
      nextErrors.website = "Website is required.";
    }

    if (!form.status) {
      nextErrors.status = "Choose a status.";
    }

    if (!form.priority) {
      nextErrors.priority = "Choose a priority.";
    }

    return nextErrors;
  };

  const handleQuickAdd = (preset: {
    name: string;
    website: string;
    status: DirectoryStatus;
    priority: Priority;
  }) => {
    setForm((current) => ({
      ...current,
      name: preset.name,
      website: preset.website,
      status: preset.status,
      priority: preset.priority,
    }));
  };

  const handleSubmit = () => {
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const sanitizedNotes = form.notes.trim();
    const nextDirectory: DirectoryItem = {
      id: generateDirectoryId(),
      name: form.name.trim(),
      website: normalizeWebsite(form.website),
      status: form.status,
      priority: form.priority,
      dateSubmitted: formatSubmittedDate(form.dateSubmitted),
      listingUrl: form.listingUrl.trim() || undefined,
      notes: form.addToChecklist
        ? sanitizedNotes
          ? `Follow-up required: ${sanitizedNotes}`
          : "Added to the review checklist."
        : sanitizedNotes || undefined,
    };

    addDirectory(nextDirectory);
    setForm(defaultFormState);
    setErrors({});
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant === "outline" ? "outline" : "default"}
        >
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle>Add directory</DialogTitle>
            <DialogDescription>
              Add a directory and where its submission stands.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Quick add
            </p>
            <div className="flex flex-wrap gap-2">
              {quickAddPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleQuickAdd(preset)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ImportCsvButton label="Import CSV" className="inline-flex items-center gap-2" />
            <Button type="button" variant="ghost" className="text-muted-foreground">
              Save draft
            </Button>
          </div>

          <FieldGroup className="gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="directory-name">Directory name</FieldLabel>
                <Input
                  id="directory-name"
                  value={form.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  placeholder="Product Hunt"
                />
                {errors.name ? <FieldError>{errors.name}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.website)}>
                <FieldLabel htmlFor="directory-website">Website</FieldLabel>
                <Input
                  id="directory-website"
                  value={form.website}
                  onChange={(event) => handleFieldChange("website", event.target.value)}
                  aria-invalid={Boolean(errors.website)}
                  placeholder="producthunt.com"
                />
                {errors.website ? <FieldError>{errors.website}</FieldError> : null}
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={Boolean(errors.status)}>
                <FieldLabel htmlFor="directory-status">Status</FieldLabel>
                <NativeSelect
                  id="directory-status"
                  value={form.status}
                  onChange={(event) =>
                    handleFieldChange("status", event.target.value as DirectoryStatus)
                  }
                  aria-invalid={Boolean(errors.status)}
                >
                  {statusOptions.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {status}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {errors.status ? <FieldError>{errors.status}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.priority)}>
                <FieldLabel htmlFor="directory-priority">Priority</FieldLabel>
                <NativeSelect
                  id="directory-priority"
                  value={form.priority}
                  onChange={(event) =>
                    handleFieldChange("priority", event.target.value as Priority)
                  }
                  aria-invalid={Boolean(errors.priority)}
                >
                  {priorityOptions.map((priority) => (
                    <NativeSelectOption key={priority} value={priority}>
                      {priority}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {errors.priority ? <FieldError>{errors.priority}</FieldError> : null}
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="directory-date">Date submitted</FieldLabel>
                <Input
                  id="directory-date"
                  type="date"
                  value={form.dateSubmitted}
                  onChange={(event) => handleFieldChange("dateSubmitted", event.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="directory-link">Listing URL</FieldLabel>
              <Input
                id="directory-link"
                value={form.listingUrl}
                onChange={(event) => handleFieldChange("listingUrl", event.target.value)}
                placeholder="https://example.com"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="directory-notes">Notes</FieldLabel>
              <textarea
                id="directory-notes"
                value={form.notes}
                onChange={(event) => handleFieldChange("notes", event.target.value)}
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                placeholder="Add tracking notes, outstanding tasks, or key requirements."
              />
            </Field>

            <label className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.addToChecklist}
                onChange={(event) =>
                  handleFieldChange("addToChecklist", event.target.checked)
                }
                className="size-4 rounded border-border text-primary-deep focus:ring-primary"
              />
              Add to review checklist
            </label>
          </FieldGroup>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            <CheckIcon className="size-4" aria-hidden="true" />
            Save directory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddDirectoryModal;
