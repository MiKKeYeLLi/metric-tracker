"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon, ListChecksIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDirectories } from "@/context/DirectoryContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export const DEFAULT_CHECKLIST_ITEMS = [
  { id: "logo", label: "Logo (square and wide)" },
  { id: "screenshots", label: "Product screenshots" },
  { id: "tagline", label: "One-line tagline" },
  { id: "long-description", label: "Long description" },
  { id: "pricing", label: "Pricing details" },
] as const;

export type ChecklistItem = { id: string; label: string };
export type CustomChecklistItems = Record<string, ChecklistItem[]>;

function useChecklistProgress(customItems: CustomChecklistItems) {
  const { selectedDirectoryId, checklistState } = useDirectories();
  const items: ChecklistItem[] = [
    ...DEFAULT_CHECKLIST_ITEMS,
    ...((selectedDirectoryId && customItems[selectedDirectoryId]) || []),
  ];
  const checked = (selectedDirectoryId && checklistState[selectedDirectoryId]) || {};
  const done = items.filter((item) => checked[item.id]).length;
  return { items, checked, done, total: items.length };
}

export function ChecklistButton({ customItems, onClick }: { customItems: CustomChecklistItems; onClick: () => void }) {
  const { selectedDirectoryId } = useDirectories();
  const { done, total } = useChecklistProgress(customItems);

  return (
    <Button type="button" variant="outline" onClick={onClick} className="shrink-0">
      <ListChecksIcon data-icon="inline-start" aria-hidden="true" />
      <span className="sm:hidden">Checklist</span>
      <span className="hidden sm:inline">Submission checklist</span>
      {selectedDirectoryId && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            done === total ? "bg-success-muted text-success" : "bg-accent text-accent-foreground"
          )}
        >
          {done}/{total}
        </span>
      )}
    </Button>
  );
}

export function SubmissionChecklistDialog({
  open,
  onOpenChange,
  customItems,
  onCustomItemsChange: setCustomItems,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customItems: CustomChecklistItems;
  onCustomItemsChange: (update: (previous: CustomChecklistItems) => CustomChecklistItems) => void;
}) {
  const { directories, selectedDirectoryId, setSelectedDirectoryId, toggleChecklistItem } = useDirectories();
  const [newItemText, setNewItemText] = useState("");
  const { items, checked, done, total } = useChecklistProgress(customItems);

  const selectedDirectory = directories.find((directory) => directory.id === selectedDirectoryId);
  const percent = total ? Math.round((done / total) * 100) : 0;

  const addCustomItem = (event: FormEvent) => {
    event.preventDefault();
    const label = newItemText.trim();
    if (!selectedDirectoryId || !label) return;
    setCustomItems((previous) => ({
      ...previous,
      [selectedDirectoryId]: [...(previous[selectedDirectoryId] ?? []), { id: `custom-${Date.now()}`, label }],
    }));
    setNewItemText("");
  };

  const deleteCustomItem = (itemId: string) => {
    if (!selectedDirectoryId) return;
    setCustomItems((previous) => ({
      ...previous,
      [selectedDirectoryId]: (previous[selectedDirectoryId] ?? []).filter((item) => item.id !== itemId),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px]">
        <DialogHeader className="shrink-0 gap-1 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-extrabold tracking-[-0.03em]">Submission checklist</DialogTitle>
          <DialogDescription>Have these ready before you submit to a directory.</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6">
          <Field>
            <FieldLabel htmlFor="checklist-directory">Directory</FieldLabel>
            <NativeSelect
              id="checklist-directory"
              className="w-full"
              value={selectedDirectoryId ?? ""}
              onChange={(event) => setSelectedDirectoryId(event.target.value)}
            >
              {!selectedDirectoryId && (
                <NativeSelectOption value="" disabled>
                  Choose a directory
                </NativeSelectOption>
              )}
              {directories.map((directory) => (
                <NativeSelectOption key={directory.id} value={directory.id}>
                  {directory.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          {selectedDirectory ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="m-0 text-sm font-semibold text-foreground" aria-live="polite">
                    {done} of {total} ready
                  </p>
                  <p className={cn("m-0 text-sm font-bold tabular-nums", done === total ? "text-success" : "text-primary-deep")}>
                    {percent}%
                  </p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-chart-track" aria-hidden="true">
                  <div
                    className={cn("h-full rounded-full transition-[width] duration-300", done === total ? "bg-success" : "bg-primary")}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {items.map((item) => {
                  const isChecked = Boolean(checked[item.id]);
                  const isCustom = !DEFAULT_CHECKLIST_ITEMS.some((defaultItem) => defaultItem.id === item.id);
                  return (
                    <li key={item.id} className="group/item flex items-center gap-1 rounded-xl transition-colors hover:bg-muted">
                      <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 px-3">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={isChecked}
                          onChange={() => toggleChecklistItem(selectedDirectory.id, item.id)}
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                            isChecked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border-strong bg-card group-hover/item:border-muted-foreground/60"
                          )}
                        >
                          {isChecked && <CheckIcon className="size-3.5" strokeWidth={3} />}
                        </span>
                        <span className={cn("text-sm", isChecked ? "text-muted-foreground line-through" : "text-foreground")}>
                          {item.label}
                        </span>
                      </label>
                      {isCustom && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${item.label}`}
                          onClick={() => deleteCustomItem(item.id)}
                          className="mr-1 pointer-fine:opacity-0 pointer-fine:group-hover/item:opacity-100 focus-visible:opacity-100"
                        >
                          <Trash2Icon aria-hidden="true" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>

              <form onSubmit={addCustomItem} className="flex items-center gap-2">
                <Input
                  aria-label={`Add a requirement for ${selectedDirectory.name}`}
                  placeholder="Add a requirement for this directory"
                  value={newItemText}
                  onChange={(event) => setNewItemText(event.target.value)}
                />
                <Button type="submit" variant="outline" size="icon-lg" aria-label="Add requirement" disabled={!newItemText.trim()}>
                  <PlusIcon aria-hidden="true" />
                </Button>
              </form>
            </>
          ) : (
            <p className="m-0 rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Choose a directory to see what&apos;s ready for its submission.
            </p>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-2xl">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
