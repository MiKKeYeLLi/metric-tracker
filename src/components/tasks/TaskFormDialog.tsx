"use client";

import { useEffect, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import type { TaskType } from "@prisma/client";

export type TaskApiItem = {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  dueAt: string;
  done: boolean;
  completedAt: string | null;
  ownerId: string | null;
  userId: string;
  owner?: { id: string; name: string | null; email: string | null } | null;
  user?: { id: string; name: string | null; email: string | null };
  createdAt: string;
  updatedAt: string;
};

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "FollowUp", label: "Follow-up" },
  { value: "Call", label: "Call" },
  { value: "Email", label: "Email" },
  { value: "Meeting", label: "Meeting" },
  { value: "Other", label: "Other" },
];

function tomorrowIsoDate(): string {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().slice(0, 10);
}

function parseIsoToInputs(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5),
    };
  } catch {
    return { date: tomorrowIsoDate(), time: "09:00" };
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (task: TaskApiItem) => void;
  taskToEdit?: TaskApiItem | null;
}

export function TaskFormDialog({ open, onClose, onSaved, taskToEdit }: Props) {
  const isEditing = Boolean(taskToEdit);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("FollowUp");
  const [dueDate, setDueDate] = useState(tomorrowIsoDate());
  const [dueTime, setDueTime] = useState("09:00");
  const [assignToMe, setAssignToMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description ?? "");
      setType(taskToEdit.type);
      const parsed = parseIsoToInputs(taskToEdit.dueAt);
      setDueDate(parsed.date);
      setDueTime(parsed.time);
      setAssignToMe(Boolean(taskToEdit.ownerId));
    } else {
      setTitle("");
      setDescription("");
      setType("FollowUp");
      setDueDate(tomorrowIsoDate());
      setDueTime("09:00");
      setAssignToMe(true);
    }
  }, [open, taskToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for the task.");
      return;
    }
    if (!dueDate) {
      setError("Please select a due date.");
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const dueAtIso = new Date(`${dueDate}T${dueTime || "09:00"}:00.000Z`).toISOString();

        if (isEditing && taskToEdit) {
          const res = await fetch(`/api/tasks/${taskToEdit.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              description: description.trim() || null,
              type,
              dueAt: dueAtIso,
            }),
          });

          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error || "Failed to update task.");
            return;
          }

          const updated = await res.json();
          onSaved(updated);
          onClose();
        } else {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              description: description.trim() || null,
              type,
              dueAt: dueAtIso,
              assignToMe,
            }),
          });

          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            setError(json.error || "Failed to create task.");
            return;
          }

          const created = await res.json();
          onSaved(created);
          onClose();
        }
      } catch {
        setError("Network error. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update task details, deadline, or notes."
              : "Create an action item, team follow-up, or outreach reminder."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel>
                Task Title <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                placeholder="e.g., Pitch TechCabal editor or Review SEO tags"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel>Task Type</FieldLabel>
              <NativeSelect value={type} onChange={(e) => setType(e.target.value as TaskType)}>
                {TASK_TYPES.map((t) => (
                  <NativeSelectOption key={t.value} value={t.value}>
                    {t.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>
                  Due Date <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Due Time</FieldLabel>
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </Field>
            </div>

            {!isEditing && (
              <div className="pt-1">
                <Checkbox
                  checked={assignToMe}
                  onChange={(e) => setAssignToMe(e.target.checked)}
                  label="Assign to me"
                />
              </div>
            )}

            <Field>
              <FieldLabel>Description / Notes</FieldLabel>
              <Textarea
                placeholder="Add context, talking points, or links..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2 size-4" />}
              {isEditing ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
