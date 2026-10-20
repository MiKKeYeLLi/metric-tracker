"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { Idea } from "./goal-model";

export function RejectIdeaDialog({
  idea,
  onOpenChange,
  onReject,
}: {
  idea: Idea | null;
  onOpenChange: (open: boolean) => void;
  onReject: (reason: string) => void;
}) {
  return (
    <Dialog open={idea !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {idea && <RejectForm key={idea.id} idea={idea} onCancel={() => onOpenChange(false)} onReject={onReject} />}
      </DialogContent>
    </Dialog>
  );
}

function RejectForm({ idea, onCancel, onReject }: { idea: Idea; onCancel: () => void; onReject: (reason: string) => void }) {
  const [reason, setReason] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    onReject(reason.trim());
    onCancel();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <DialogHeader className="gap-1">
        <DialogTitle className="text-xl font-extrabold tracking-[-0.03em]">Reject idea</DialogTitle>
        <DialogDescription>
          &ldquo;{idea.title}&rdquo; will move to Rejected. Agents can still see it, so they won&rsquo;t propose it again.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="reject-reason">Reason</FieldLabel>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. This is a task, not a workstream. Propose it under On-page SEO."
            rows={3}
            maxLength={1000}
            autoFocus
          />
          <FieldDescription>Optional. Helps the agent propose something better next time.</FieldDescription>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive">
          Reject idea
        </Button>
      </DialogFooter>
    </form>
  );
}
