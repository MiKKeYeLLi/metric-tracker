"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { TaskApiItem } from "./TaskFormDialog";

interface Props {
  open: boolean;
  task: TaskApiItem | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function TaskDeleteDialog({ open, task, onClose, onDeleted }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!task) return null;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
        if (res.ok) {
          onDeleted(task.id);
          onClose();
        }
      } catch {
        // Network error handled quietly
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold text-foreground">"{task.title}"</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Spinner className="mr-2 size-4" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
