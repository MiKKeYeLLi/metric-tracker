"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon, ListChecksIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDirectories } from "@/context/DirectoryContext";
import { directoryLabel } from "@/components/directories/AddDirectoryModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Spinner } from "@/components/ui/spinner";

function useSelectedDirectory() {
  const { directories, selectedDirectoryId } = useDirectories();
  return directories.find((directory) => directory.id === selectedDirectoryId) ?? null;
}

export function ChecklistButton({ onClick }: { onClick: () => void }) {
  const selected = useSelectedDirectory();
  const done = selected?.checklist.filter((item) => item.done).length ?? 0;
  const total = selected?.checklist.length ?? 0;

  return (
    <Button type="button" variant="outline" onClick={onClick} className="shrink-0">
      <ListChecksIcon data-icon="inline-start" aria-hidden="true" />
      <span className="sm:hidden">Checklist</span>
      <span className="hidden sm:inline">Submission checklist</span>
      {selected && total > 0 && (
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

export function SubmissionChecklistDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { directories, selectedDirectoryId, setSelectedDirectoryId, toggleChecklistItem, addChecklistItem, removeChecklistItem } =
    useDirectories();
  const selected = useSelectedDirectory();
  const [newItemText, setNewItemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const items = selected?.checklist ?? [];
  const done = items.filter((item) => item.done).length;
  const total = items.length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  const run = (action: Promise<void>) => {
    setError("");
    action.catch((actionError: unknown) =>
      setError(actionError instanceof Error ? actionError.message : "Couldn't save that. Please try again.")
    );
  };

  const addCustomItem = async (event: FormEvent) => {
    event.preventDefault();
    const label = newItemText.trim();
    if (!selected || !label) return;
    setIsAdding(true);
    setError("");
    try {
      await addChecklistItem(selected.id, label);
      setNewItemText("");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Couldn't add that. Please try again.");
    } finally {
      setIsAdding(false);
    }
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
              onChange={(event) => {
                setError("");
                setSelectedDirectoryId(event.target.value);
              }}
            >
              {!selected && (
                <NativeSelectOption value="" disabled>
                  Choose a directory
                </NativeSelectOption>
              )}
              {directories.map((directory) => (
                <NativeSelectOption key={directory.id} value={directory.id}>
                  {directoryLabel(directory)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selected ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="m-0 text-sm font-semibold text-foreground" aria-live="polite">
                    {done} of {total} ready
                  </p>
                  <p className={cn("m-0 text-sm font-bold tabular-nums", done === total && total > 0 ? "text-success" : "text-primary-deep")}>
                    {percent}%
                  </p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-chart-track" aria-hidden="true">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-300",
                      done === total && total > 0 ? "bg-success" : "bg-primary"
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {items.map((item) => (
                  <li key={item.id} className="group/item flex items-center gap-1 rounded-xl transition-colors hover:bg-muted">
                    <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 px-3">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={item.done}
                        onChange={() => run(toggleChecklistItem(selected.id, item.id, !item.done))}
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                          item.done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border-strong bg-card group-hover/item:border-muted-foreground/60"
                        )}
                      >
                        {item.done && <CheckIcon className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className={cn("text-sm", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
                        {item.label}
                      </span>
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.label}`}
                      onClick={() => run(removeChecklistItem(selected.id, item.id))}
                      className="mr-1 pointer-fine:opacity-0 pointer-fine:group-hover/item:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>

              <form onSubmit={(event) => void addCustomItem(event)} className="flex items-center gap-2">
                <Input
                  aria-label={`Add a requirement for ${directoryLabel(selected)}`}
                  placeholder="Add a requirement for this directory"
                  value={newItemText}
                  onChange={(event) => setNewItemText(event.target.value)}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon-lg"
                  aria-label="Add requirement"
                  disabled={!newItemText.trim() || isAdding}
                >
                  {isAdding ? <Spinner aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}
                </Button>
              </form>
            </>
          ) : (
            <p className="m-0 rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              {directories.length === 0
                ? "Add a directory first, and its checklist will show here."
                : "Choose a directory to see what's ready for its submission."}
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
