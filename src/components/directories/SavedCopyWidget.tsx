"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckIcon, CopyIcon, Edit3Icon, MoreHorizontalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface SavedCopyBlock {
  id: string;
  label: string;
  text: string;
}

const COPY_FEEDBACK_MS = 1600;
// Roughly three lines of the tile's text at its narrowest width.
const CLAMP_THRESHOLD = 140;

export const INITIAL_COPY_BLOCKS: SavedCopyBlock[] = [
  {
    id: "tagline",
    label: "Tagline",
    text: "Track every directory that matters.",
  },
  {
    id: "short",
    label: "Short description",
    text: "Zedu Amp keeps our directory submissions in one calm, organized workspace.",
  },
  {
    id: "long",
    label: "Long description",
    text: "Zedu Amp brings content, SEO, social and paid metrics into one workspace the whole team can scan. Easily monitor listing status, review feedback, and manage marketing distribution across all major product directories.",
  },
];

const characters = (text: string) => `${text.length.toLocaleString()} ${text.length === 1 ? "character" : "characters"}`;

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
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | undefined>(undefined);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<SavedCopyBlock | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formText, setFormText] = useState("");

  useEffect(() => {
    if (feedback === undefined) return;
    const timer = window.setTimeout(() => setFeedback(undefined), COPY_FEEDBACK_MS);
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

  const toggleExpanded = (id: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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

  const canSave = formLabel.trim() !== "" && formText.trim() !== "";

  const handleSaveBlock = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    if (editingBlock) {
      setBlocks((previous) =>
        previous.map((block) =>
          block.id === editingBlock.id ? { ...block, label: formLabel.trim(), text: formText.trim() } : block
        )
      );
    } else {
      setBlocks((previous) => [...previous, { id: `copy-${Date.now()}`, label: formLabel.trim(), text: formText.trim() }]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((previous) => previous.filter((block) => block.id !== id));
  };

  return (
    <section
      aria-labelledby="saved-copy-title"
      className={cn("flex min-w-0 flex-col gap-4 rounded-[22px] border border-border bg-card p-4 sm:p-5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="saved-copy-title" className="m-0 text-[17px] leading-tight font-bold tracking-[-0.02em] text-foreground">
            {title}
          </h2>
          <p className="m-0 text-[13px] text-muted-foreground">{helper}</p>
        </div>
        <Button variant="outline" size="sm" onClick={openAddModal} className="shrink-0">
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          Add copy
        </Button>
      </div>

      {blocks.length === 0 ? (
        <p className="m-0 rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Save your tagline and descriptions here to paste them into any directory.
        </p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
          {blocks.map((block) => {
            const state = feedback?.id === block.id ? feedback : undefined;
            const isLong = block.text.length > CLAMP_THRESHOLD;
            const isExpanded = expanded.has(block.id);
            return (
              <li key={block.id} className="flex min-w-0 flex-col gap-3 rounded-2xl bg-muted p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <p className="m-0 truncate text-sm font-semibold text-foreground" title={block.label}>
                      {block.label}
                    </p>
                    <p className="m-0 text-xs text-muted-foreground tabular-nums">{characters(block.text)}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      type="button"
                      aria-label={`More actions for ${block.label}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "-mt-1 -mr-1 hover:bg-card")}
                    >
                      <MoreHorizontalIcon aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onSelect={() => openEditModal(block)}>
                        <Edit3Icon aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteBlock(block.id)}>
                        <Trash2Icon aria-hidden="true" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p
                  className={cn(
                    "m-0 text-sm leading-relaxed break-words whitespace-pre-line text-foreground/85",
                    isLong && !isExpanded && "line-clamp-3"
                  )}
                >
                  {block.text}
                </p>

                <div className="mt-auto flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(block)}
                  >
                    {state?.ok ? (
                      <CheckIcon data-icon="inline-start" aria-hidden="true" className="text-success" />
                    ) : (
                      <CopyIcon data-icon="inline-start" aria-hidden="true" />
                    )}
                    {state?.ok ? (
                      <span className="text-success">Copied</span>
                    ) : state?.ok === false ? (
                      <span className="text-destructive">Couldn&apos;t copy</span>
                    ) : (
                      "Copy"
                    )}
                  </Button>
                  {isLong && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpanded(block.id)}
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">
        {feedback?.ok ? "Copied to clipboard" : feedback?.ok === false ? "Couldn't copy to clipboard" : ""}
      </p>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]">
          <form onSubmit={handleSaveBlock} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="shrink-0 gap-1 px-6 pt-6 pb-4">
              <DialogTitle className="text-xl font-extrabold tracking-[-0.03em]">
                {editingBlock ? "Edit copy" : "Add copy"}
              </DialogTitle>
              <DialogDescription>Save text you paste into directory listings again and again.</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="copy-label">Label</FieldLabel>
                  <Input
                    id="copy-label"
                    placeholder="e.g. Founder bio, Keywords, Pricing summary"
                    value={formLabel}
                    onChange={(event) => setFormLabel(event.target.value)}
                    autoComplete="off"
                    autoFocus
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="copy-text">Text</FieldLabel>
                  <Textarea
                    id="copy-text"
                    rows={6}
                    placeholder="Paste or type the text you reuse in submissions"
                    value={formText}
                    onChange={(event) => setFormText(event.target.value)}
                  />
                  <FieldDescription className="text-xs tabular-nums">{characters(formText)}</FieldDescription>
                </Field>
              </FieldGroup>
            </div>
            <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-2xl">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSave}>
                {editingBlock ? "Save changes" : "Add copy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default SavedCopyWidget;
