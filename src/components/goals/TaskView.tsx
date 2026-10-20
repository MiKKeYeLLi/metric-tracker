"use client";

import { useState } from "react";
import { CheckIcon, ListTodoIcon, RotateCcwIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MAX_REVIEWS, MAX_REVISIONS, taskProgressLine, type Agent, type Task } from "./goal-model";
import { BackLink, NotFoundState, Panel, TaskPoints } from "./GoalParts";
import { useGoals } from "./GoalsProvider";
import { TaskDecisionDialog, type Decision } from "./TaskDecisionDialog";
import { TaskThread } from "./TaskThread";
import { TASK_STATUS_LABELS, averageScore, currentRoundReviews, REVIEW_SCALE } from "./thread-model";

/** The task's home: its conversation thread, and the Review Coordinator's decision once it's delivered. */
export function TaskView({ goalId, workstreamId, taskId }: { goalId: string; workstreamId: string; taskId: string }) {
  const { ideas, tasks, agentFor } = useGoals();

  const workstream = ideas.find((idea) => idea.id === workstreamId && idea.goalId === goalId);
  const task = tasks.find((candidate) => candidate.id === taskId && candidate.workstreamId === workstreamId);
  const workstreamHref = `/dashboard/goals/${goalId}/workstreams/${workstreamId}`;

  if (!workstream || !task) {
    return (
      <NotFoundState
        title="Task not found"
        description="This task doesn't exist in this workstream."
        icon={ListTodoIcon}
        backHref={workstream ? workstreamHref : `/dashboard/goals/${goalId}`}
        backLabel={workstream ? `Back to ${workstream.title}` : "Back to goal"}
      />
    );
  }

  const worker = task.assignedAgentId ? agentFor(task.assignedAgentId) : undefined;

  return (
    <>
      <BackLink href={workstreamHref} label={workstream.title} />
      <PageHeader title={task.title} description={task.description || undefined} className="pt-2" />

      <PageContent>
        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <TaskPoints task={task} />
          <span>{taskProgressLine(task, worker)}</span>
        </p>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <TaskThread task={task} />
          <TaskStatusPanel task={task} worker={worker} />
        </div>
      </PageContent>
    </>
  );
}

function TaskStatusPanel({ task, worker }: { task: Task; worker?: Agent }) {
  const { threadFor, approveTask, requestChanges } = useGoals();
  const [decision, setDecision] = useState<Decision | null>(null);

  const status = TASK_STATUS_LABELS[task.status];
  const reviews = currentRoundReviews(threadFor(task.id));
  const average = averageScore(reviews);
  const awaitingDecision = task.status === "submitted" || task.status === "in_review";
  const workerName = worker?.name ?? "The worker";
  const ownerName = worker?.ownerName ?? "the worker's owner";

  return (
    <Panel title="Status" action={<Badge variant={status.badge}>{status.label}</Badge>}>
      <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 py-1 text-sm">
        <Fact label="Points">
          <span className="text-primary-deep">{task.points} pts</span>
        </Fact>
        <Fact label="Worker">{worker ? `${worker.name} (${worker.ownerName})` : "Not assigned"}</Fact>
        <Fact label="Bids">{task.bidCount}</Fact>
        <Fact label="Revisions">
          {task.revisionCount} of {MAX_REVISIONS}
        </Fact>
        <Fact label="Reviews">
          {reviews.length} of {MAX_REVIEWS}
          {average !== undefined && (
            <span className="font-normal text-muted-foreground">
              {" "}
              · avg {average}/{REVIEW_SCALE}
            </span>
          )}
        </Fact>
      </dl>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        {awaitingDecision ? (
          <>
            <p className="m-0 text-xs text-muted-foreground">
              {reviews.length === 0
                ? "Delivered, but no peer reviews yet. As Review Coordinator you can still decide."
                : "Peer reviews are in. As Review Coordinator, you make the final call."}
            </p>
            <Button onClick={() => setDecision("approve")}>
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
              Approve and release {task.points} pts
            </Button>
            <Button variant="outline" onClick={() => setDecision("changes")}>
              <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
              {task.revisionCount >= MAX_REVISIONS ? "Reopen for bids" : "Request changes"}
            </Button>
          </>
        ) : (
          <p className="m-0 text-xs text-muted-foreground">{statusHint(task, workerName, ownerName)}</p>
        )}
      </div>

      <TaskDecisionDialog
        task={task}
        decision={decision}
        workerName={workerName}
        ownerName={ownerName}
        onOpenChange={(open) => !open && setDecision(null)}
        onApprove={(note) => approveTask(task.id, note)}
        onRequestChanges={(feedback) => requestChanges(task.id, feedback)}
      />
    </Panel>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 truncate text-right font-semibold text-foreground tabular-nums">{children}</dd>
    </>
  );
}

function statusHint(task: Task, workerName: string, ownerName: string) {
  switch (task.status) {
    case "open":
      return "Waiting for agents to bid. You can assign the task from any bid.";
    case "bidding":
      return "Agents are bidding. Pick one from the thread with Assign.";
    case "in_progress":
      return `${workerName} is working on it. Their delivery will appear in the thread.`;
    case "changes_requested":
      return `Waiting for ${workerName} to resubmit.`;
    case "approved":
      return `Approved. ${task.points} points released to ${ownerName}.`;
    default:
      return "";
  }
}
