"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  CircleCheckIcon,
  CircleXIcon,
  LightbulbIcon,
  PencilLineIcon,
  PlusIcon,
  SendIcon,
  UploadIcon,
  type LucideIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useDirectories } from "@/context/DirectoryContext";
import type { DirectoryInput, DirectoryItem, DirectoryStatus, Priority } from "@/types/directory";

export const STATUS_OPTIONS: DirectoryStatus[] = ["Not submitted", "Pending review", "Needs changes", "Live", "Rejected"];
export const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];

/** How to show a directory that may only have a name or only a website. */
export function directoryLabel(directory: Pick<DirectoryItem, "name" | "website">) {
  return directory.name || directory.website || "Untitled directory";
}

export function normalizeWebsite(value: string) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

type FormState = {
  name: string;
  website: string;
  status: DirectoryStatus;
  priority: Priority;
  dateSubmitted: string;
  listingUrl: string;
  notes: string;
};

function formFrom(directory: DirectoryItem | null): FormState {
  return {
    name: directory?.name ?? "",
    website: directory?.website ?? "",
    status: directory?.status ?? "Not submitted",
    priority: directory?.priority ?? "Medium",
    dateSubmitted: directory?.dateSubmitted ?? "",
    listingUrl: directory?.listingUrl ?? "",
    notes: directory?.notes ?? "",
  };
}

/** Adds a new directory, or edits `directory` when one is given. */
export function DirectoryFormDialog({
  open,
  onOpenChange,
  directory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  directory: DirectoryItem | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]">
        {open && <DirectoryForm key={directory?.id ?? "new"} directory={directory} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

const STAGES: { value: DirectoryStatus; icon: LucideIcon; hint: string }[] = [
  { value: "Not submitted", icon: LightbulbIcon, hint: "An idea or shortlist pick" },
  { value: "Pending review", icon: SendIcon, hint: "Submitted, waiting" },
  { value: "Needs changes", icon: PencilLineIcon, hint: "They asked for edits" },
  { value: "Live", icon: CircleCheckIcon, hint: "Listed" },
  { value: "Rejected", icon: CircleXIcon, hint: "Turned down" },
];

function DirectoryForm({ directory, onDone }: { directory: DirectoryItem | null; onDone: () => void }) {
  const { addDirectory, updateDirectory } = useDirectories();
  const [form, setForm] = useState<FormState>(() => formFrom(directory));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = directory !== null;
  const submitted = form.status !== "Not submitted";
  const canSave = form.name.trim() !== "" || form.website.trim() !== "";

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) {
      setError("Add a name or a website so you can recognise it later.");
      return;
    }
    const input: DirectoryInput = {
      name: form.name.trim(),
      website: normalizeWebsite(form.website),
      status: form.status,
      priority: form.priority,
      dateSubmitted: submitted && form.dateSubmitted ? form.dateSubmitted : null,
      listingUrl: form.status === "Live" ? form.listingUrl.trim() || null : (directory?.listingUrl ?? null),
      notes: form.notes.trim() || null,
    };
    setIsSaving(true);
    try {
      if (isEditing) {
        // Leave the submission date alone unless it was changed, so the server can default it.
        const { dateSubmitted, ...rest } = input;
        await updateDirectory(directory.id, dateSubmitted !== directory.dateSubmitted ? input : rest);
      } else {
        await addDirectory(input);
      }
      onDone();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn't save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="shrink-0 gap-1 px-6 pt-6 pb-4">
        <DialogTitle className="text-xl font-extrabold tracking-[-0.03em]">
          {isEditing ? `Edit ${directoryLabel(directory)}` : "Add directory"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update where this submission stands."
            : "Pick where it stands and fill in only what you know. A name or a website is enough to start."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6">
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2.5 text-[13px] font-semibold text-foreground">Status</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {STAGES.map(({ value, icon: Icon, hint }) => (
              <label
                key={value}
                className="group/stage flex cursor-pointer flex-col gap-2 rounded-2xl border border-border bg-card p-3 transition-[border-color,background-color] hover:border-border-strong has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input
                  type="radio"
                  name="directory-status"
                  value={value}
                  checked={form.status === value}
                  onChange={() => update("status", value)}
                  className="sr-only"
                />
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-has-checked/stage:bg-primary group-has-checked/stage:text-primary-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] leading-tight font-semibold text-foreground group-has-checked/stage:text-accent-foreground">
                    {value}
                  </span>
                  <span className="hidden text-xs leading-snug text-muted-foreground sm:block">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="directory-name">Name</FieldLabel>
              <Input
                id="directory-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="e.g. Product Hunt"
                autoComplete="off"
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="directory-website">Website</FieldLabel>
              <Input
                id="directory-website"
                value={form.website}
                onChange={(event) => update("website", event.target.value)}
                placeholder="producthunt.com"
                inputMode="url"
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="directory-priority">Priority</FieldLabel>
              <NativeSelect
                id="directory-priority"
                className="w-full"
                value={form.priority}
                onChange={(event) => update("priority", event.target.value as Priority)}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <NativeSelectOption key={priority} value={priority}>
                    {priority}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            {submitted && (
              <Field>
                <FieldLabel htmlFor="directory-date">Date submitted</FieldLabel>
                <Input
                  id="directory-date"
                  type="date"
                  value={form.dateSubmitted}
                  onChange={(event) => update("dateSubmitted", event.target.value)}
                />
                {!form.dateSubmitted && <FieldDescription className="text-xs">Defaults to today</FieldDescription>}
              </Field>
            )}
          </div>

          {form.status === "Live" && (
            <Field>
              <FieldLabel htmlFor="directory-listing">Listing link</FieldLabel>
              <Input
                id="directory-listing"
                type="url"
                inputMode="url"
                value={form.listingUrl}
                onChange={(event) => update("listingUrl", event.target.value)}
                placeholder="https://"
                autoComplete="off"
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="directory-notes">Notes</FieldLabel>
            <Textarea
              id="directory-notes"
              rows={submitted ? 3 : 4}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder={
                submitted ? "Requirements, feedback from reviewers, next steps" : "Why it's worth it, audience, submission rules"
              }
            />
          </Field>
        </FieldGroup>
      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-2xl">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || !canSave}>
          {isSaving && <Spinner data-icon="inline-start" />}
          {isSaving ? "Saving…" : isEditing ? "Save changes" : "Add directory"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddDirectoryModal({ triggerLabel = "Add directory" }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" aria-hidden="true" />
        {triggerLabel}
      </Button>
      <DirectoryFormDialog open={open} onOpenChange={setOpen} directory={null} />
    </>
  );
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/** Imports rows in the same column order the export writes: name, website, status, priority, date submitted, listing URL. */
export function ImportCsvButton({ label = "Import CSV" }: { label?: string }) {
  const { addDirectory, reportError } = useDirectories();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const rows = (await file.text())
      .replace(/^﻿/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map(parseCsvLine)
      .filter((row) => row[0] && row[0].toLocaleLowerCase() !== "directory");

    setIsImporting(true);
    let failed = 0;
    for (const row of rows) {
      const status = STATUS_OPTIONS.find((option) => option === row[2]) ?? "Not submitted";
      const date = /^\d{4}-\d{2}-\d{2}$/.test(row[4] ?? "") ? row[4] : null;
      try {
        await addDirectory({
          name: row[0],
          website: normalizeWebsite(row[1] || row[0]),
          status,
          priority: PRIORITY_OPTIONS.find((option) => option === row[3]) ?? "Medium",
          dateSubmitted: status === "Not submitted" ? null : date,
          listingUrl: row[5] || null,
          notes: null,
        });
      } catch {
        failed += 1;
      }
    }
    setIsImporting(false);
    if (failed > 0) reportError(new Error(`${failed} of ${rows.length} rows couldn't be imported. Check their website and link columns.`));
  };

  return (
    <>
      <button type="button" className={buttonVariants({ variant: "outline" })} disabled={isImporting} onClick={() => inputRef.current?.click()}>
        {isImporting ? <Spinner data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" aria-hidden="true" />}
        {isImporting ? "Importing…" : label}
      </button>
      <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void handleImport(event)} />
    </>
  );
}
