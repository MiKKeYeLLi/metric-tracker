"use client";

import { useMemo, useState } from "react";
import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDirectories } from "@/context/DirectoryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const DEFAULT_CHECKLIST_ITEMS = [
  { id: "logo", label: "Logo (square and wide)" },
  { id: "screenshots", label: "Product screenshots" },
  { id: "tagline", label: "One-line tagline" },
  { id: "long-description", label: "Long description" },
  { id: "pricing", label: "Pricing details" },
] as const;

export function SubmissionChecklist({
  title = "Submission checklist",
  helper = "Have these ready before submitting anywhere.",
  className,
}: {
  title?: string;
  helper?: string;
  className?: string;
}) {
  const {
    directories,
    selectedDirectoryId,
    checklistState,
    toggleChecklistItem,
  } = useDirectories();

  const [customItems, setCustomItems] = useState<
    Record<string, { id: string; label: string }[]>
  >({});
  const [newItemText, setNewItemText] = useState("");

  const selectedDirectory = directories.find(
    (d) => d.id === selectedDirectoryId,
  );

  // Combine default static items with any user-added custom items for this directory
  const activeDirectoryCustoms =
    (selectedDirectoryId && customItems[selectedDirectoryId]) || [];
  const allItems = [...DEFAULT_CHECKLIST_ITEMS, ...activeDirectoryCustoms];

  const currentDirChecklist = (selectedDirectoryId &&
    checklistState[selectedDirectoryId]) || {
    logo: false,
    screenshots: false,
    tagline: false,
    "long-description": false,
    pricing: false,
  };

  const checkedSet = useMemo(() => {
    const set = new Set<string>();
    Object.entries(currentDirChecklist).forEach(([key, isChecked]) => {
      if (isChecked) set.add(key);
    });
    return set;
  }, [currentDirChecklist]);

  const toggle = (itemKey: string) => {
    if (!selectedDirectoryId) return;
    toggleChecklistItem(selectedDirectoryId, itemKey as any);
  };

  const addCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirectoryId || !newItemText.trim()) return;

    const customId = `custom-${Date.now()}`;
    setCustomItems((prev) => ({
      ...prev,
      [selectedDirectoryId]: [
        ...(prev[selectedDirectoryId] || []),
        { id: customId, label: newItemText.trim() },
      ],
    }));
    setNewItemText("");
  };

  const deleteCustomItem = (itemId: string) => {
    if (!selectedDirectoryId) return;
    setCustomItems((prev) => ({
      ...prev,
      [selectedDirectoryId]: (prev[selectedDirectoryId] || []).filter(
        (item) => item.id !== itemId,
      ),
    }));
  };

  const done = checkedSet.size;
  const total = allItems.length;

  return (
    <section
      aria-label={title}
      className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold tracking-[-0.02em] text-foreground">
          {title}
        </h3>
        {selectedDirectory && (
          <span
            className="max-w-[120px] truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            title={selectedDirectory.name}
          >
            {selectedDirectory.name}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>

      <ul className="mt-3 flex flex-col gap-0.5 max-h-52 overflow-y-auto pr-1">
        {allItems.map((item) => {
          const isChecked = checkedSet.has(item.id);
          const isCustom = !DEFAULT_CHECKLIST_ITEMS.some(
            (d) => d.id === item.id,
          );

          return (
            <li
              key={item.id}
              className="group/item flex items-center justify-between rounded-md hover:bg-muted px-1"
            >
              <label
                className={cn(
                  "flex min-h-8 flex-1 cursor-pointer items-center gap-2.5 py-1",
                  !selectedDirectoryId && "opacity-50 cursor-not-allowed",
                )}
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isChecked}
                  disabled={!selectedDirectoryId}
                  onChange={() => toggle(item.id)}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
                    "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                    isChecked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border-strong bg-card group-hover/item:border-muted-foreground/60",
                  )}
                >
                  {isChecked && (
                    <CheckIcon className="size-3" strokeWidth={3} />
                  )}
                </span>
                <span className="text-[13px] text-foreground truncate">
                  {item.label}
                </span>
              </label>

              {isCustom && selectedDirectoryId && (
                <button
                  type="button"
                  onClick={() => deleteCustomItem(item.id)}
                  className="opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-opacity"
                  title="Delete custom requirement"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Add custom checklist item form */}
      {selectedDirectoryId && (
        <form
          onSubmit={addCustomItem}
          className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-border"
        >
          <Input
            type="text"
            placeholder="Add requirement..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="h-7 text-xs px-2"
          />
          <Button
            type="submit"
            size="icon-xs"
            variant="outline"
            className="h-7 w-7 shrink-0"
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </form>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <p
          className="font-mono text-2xs text-muted-foreground"
          aria-live="polite"
        >
          {done} of {total} ready
        </p>
        {!selectedDirectoryId && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            Select a row first
          </span>
        )}
      </div>
    </section>
  );
}

export default SubmissionChecklist;
