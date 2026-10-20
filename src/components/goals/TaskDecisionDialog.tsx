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
import { MAX_REVISIONS, type Task } from "./goal-model";

export type Decision = "approve" | "changes";

/** The Review Coordinator's final call on a delivery: approve and release points, or send it back. */
export function TaskDecisionDialog({
  task,
  decision,
  workerName,
  ownerName,
  onOpenChange,
  onApprove,
  onRequestChanges,
}: {
  task: Task;
  decision: Decision | null;
  workerName: string;
  ownerName: string;
  onOpenChange: (open: boolean) => void;
  onApprove: (note: string) => void;
  onRequestChanges: (feedback: string) => void;
}) {
  return (
    <Dialog open={decision !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {decision && (
          <DecisionForm
            key={decision}
            task={task}
            decision={decision}
            workerName={workerName}
            ownerName={ownerName}
            onCancel={() => onOpenChange(false)}
            onSubmit={(text) => (decision === "approve" ? onApprove(text) : onRequestChanges(text))}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DecisionForm({
  task,
  decision,
  workerName,
  ownerName,
  onCancel,
  onSubmit,
}: {
  task: Task;
  decision: Decision;
  workerName: string;
  ownerName: string;
  onCancel: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const approving = decision === "approve";
  const lastRevision = task.revisionCount >= MAX_REVISIONS;
  const id = `decision-${task.id}`;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!approving && !text.trim()) return;
    onSubmit(text.trim());
    onCancel();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <DialogHeader className="gap-1">
        <DialogTitle className="text-xl font-extrabold tracking-[-0.03em]">
          {approving ? "Approve delivery" : lastRevision ? "Reopen for bids" : "Request changes"}
        </DialogTitle>
        <DialogDescription>
          {approving
            ? `This closes the task and releases ${task.points} points to ${ownerName}.`
            : lastRevision
              ? `${workerName} has used both revision rounds. Sending it back unassigns them and reopens the task for bids.`
              : `${workerName} gets your feedback and resubmits. This is revision ${task.revisionCount + 1} of ${MAX_REVISIONS}.`}
        </DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={id}>{approving ? "Note" : "Feedback"}</FieldLabel>
          <Textarea
            id={id}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={approving ? "e.g. Great work, publishing this today." : "What needs to change before you'll approve it?"}
            rows={3}
            maxLength={2000}
            required={!approving}
            autoFocus
          />
          <FieldDescription>
            {approving ? "Optional. Posted to the thread with the approval." : "Required. Posted to the thread for the worker."}
          </FieldDescription>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant={approving ? "default" : "destructive"} disabled={!approving && !text.trim()}>
          {approving ? `Approve and release ${task.points} pts` : lastRevision ? "Reopen for bids" : "Request changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
