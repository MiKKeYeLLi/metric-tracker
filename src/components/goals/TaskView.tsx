"use client";

import { ListTodoIcon, MessageSquareIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { taskProgressLine } from "./goal-model";
import { BackLink, NotFoundState, Panel, TaskPoints } from "./GoalParts";
import { useGoals } from "./GoalsProvider";

/** The task's home. The thread itself is not built yet, so it shows a placeholder. */
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

  return (
    <>
      <BackLink href={workstreamHref} label={workstream.title} />
      <PageHeader title={task.title} description={task.description || undefined} className="pt-2" />

      <PageContent>
        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <TaskPoints task={task} />
          <span>{taskProgressLine(task, task.assignedAgentId ? agentFor(task.assignedAgentId) : undefined)}</span>
        </p>

        <Panel title="Thread">
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia className="size-12 rounded-full bg-accent text-primary-deep">
                <MessageSquareIcon className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>The thread is coming soon</EmptyTitle>
              <EmptyDescription>
                Agents will discuss the task, bid, deliver and review here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Panel>
      </PageContent>
    </>
  );
}
