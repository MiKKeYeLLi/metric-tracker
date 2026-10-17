"use client";

import { useEffect, useState } from "react";
import {
  CopyIcon,
  Edit3Icon,
  PlusIcon,
  Trash2Icon,
  CheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SavedCopyBlock {
  id: string;
  label: string;
  text: string;
}

const COPY_FEEDBACK_MS = 1600;

export const INITIAL_COPY_BLOCKS: SavedCopyBlock[] = [
  {
    id: "tagline",
    label: "Tagline",
    text: "Track every directory that matters.",
  },
  {
    id: "short",
    label: "Short description",
    text: "Metric Tracker keeps our directory submissions in one calm, organized workspace.",
  },
  {
    id: "long",
    label: "Long description",
    text: "Metric Tracker brings content, SEO, social and paid metrics into one workspace the whole team can scan. Easily monitor listing status, review feedback, and manage marketing distribution across all major product directories.",
  },
];

export function SavedCopyWidget({
  title = "Saved submission copy",
  helper = "Reusable text so every listing says the same thing.",
  className,
}: {
  title?: string;
  helper?: string;
  className?: string;
}) {
  const [blocks, setBlocks] = useState<SavedCopyBlock[]>(INITIAL_COPY_BLOCKS);
  const [feedback, setFeedback] = useState<
    { id: string; ok: boolean } | undefined
  >(undefined);

  // Modal State for Adding/Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<SavedCopyBlock | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formText, setFormText] = useState("");

  useEffect(() => {
    if (feedback === undefined) return;
    const timer = window.setTimeout(
      () => setFeedback(undefined),
      COPY_FEEDBACK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const copyToClipboard = async (block: SavedCopyBlock) => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available");
      }
      await navigator.clipboard.writeText(block.text);
      setFeedback({ id: block.id, ok: true });
    } catch {
      setFeedback({ id: block.id, ok: false });
    }
  };

  const openAddModal = () => {
    setEditingBlock(null);
    setFormLabel("");
    setFormText("");
    setIsModalOpen(true);
  };

  const openEditModal = (block: SavedCopyBlock) => {
    setEditingBlock(block);
    setFormLabel(block.label);
    setFormText(block.text);
    setIsModalOpen(true);
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim() || !formText.trim()) return;

    if (editingBlock) {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === editingBlock.id
            ? { ...b, label: formLabel.trim(), text: formText.trim() }
            : b,
        ),
      );
    } else {
      const newBlock: SavedCopyBlock = {
        id: `copy-${Date.now()}`,
        label: formLabel.trim(),
        text: formText.trim(),
      };
      setBlocks((prev) => [...prev, newBlock]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <section
      aria-label={title}
      className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-bold tracking-[-0.02em] text-foreground">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
        </div>
        <Button
          onClick={openAddModal}
          size="icon-xs"
          variant="outline"
          className="h-7 w-7 shrink-0"
          title="Add copy snippet"
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
        {blocks.map((block) => {
          const state = feedback?.id === block.id ? feedback : undefined;
          return (
            <div
              key={block.id}
              className="group relative flex flex-col gap-1.5 rounded-lg border border-border bg-background p-3 shadow-2xs"
            >
              {/* Category Header & Controls */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {block.label}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(block)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"
                    title="Edit block"
                  >
                    <Edit3Icon className="size-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                    title="Delete block"
                  >
                    <Trash2Icon className="size-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(block)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer ml-1",
                      state?.ok
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : state?.ok === false
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary hover:bg-primary/20",
                    )}
                  >
                    {state?.ok ? (
                      <>
                        <CheckIcon className="size-3" /> Copied!
                      </>
                    ) : state?.ok === false ? (
                      "Failed"
                    ) : (
                      <>
                        <CopyIcon className="size-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable/Scrollable Text Content Box */}
              <div className="max-h-28 overflow-y-auto rounded-md border border-border/60 bg-muted/30 p-2 text-xs leading-relaxed text-muted-foreground select-all">
                {block.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Adding / Editing Copy Snippets */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? "Edit Copy Snippet" : "Add Submission Copy"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBlock} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Category / Label
              </label>
              <Input
                placeholder="e.g. Founder Bio, Tagline, Keywords..."
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Copy Content
              </label>
              <textarea
                placeholder="Paste or type reusable submission text here..."
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                required
                className="min-h-28 w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingBlock ? "Save Changes" : "Add Copy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default SavedCopyWidget;
