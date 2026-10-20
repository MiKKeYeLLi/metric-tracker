"use client";

import { useMemo } from "react";
import { FolderTreeIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TASK_STAGES, shortDate, taskProgressLine, type Task } from "./goal-model";
import { BackLink, NotFoundState, Panel, QuietEmpty, RowList, TaskPoints, ThreadButton } from "./GoalParts";
import { useGoals } from "./GoalsProvider";

export function WorkstreamView({ goalId, workstreamId }: { goalId: string; workstreamId: string }) {
  const { goals, ideas, tasks, currentUser, agentFor, bidsFor } = useGoals();

  const goal = goals.find((candidate) => candidate.id === goalId);
  const workstream = ideas.find(
    (idea) => idea.id === workstreamId && idea.goalId === goalId && idea.status === "accepted"
  );
  const workstreamTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.workstreamId === workstreamId)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [tasks, workstreamId]
  );

  if (!goal || !workstream) {
    return (
      <NotFoundState
        title="Workstream not found"
        description="This workstream doesn't exist, or its idea hasn't been approved yet."
        icon={FolderTreeIcon}
        backHref={goal ? `/dashboard/goals/${goal.id}` : "/dashboard/goals"}
        backLabel={goal ? `Back to ${goal.title}` : "Back to goals"}
      />
    );
  }

  const stages = TASK_STAGES.map((stage) => ({
    ...stage,
    tasks: workstreamTasks.filter((task) => stage.statuses.includes(task.status)),
  }));
  const firstBusyStage = stages.find((stage) => stage.tasks.length > 0)?.value ?? "open";
  const ideaAgent = agentFor(workstream.agentId);

  return (
    <>
      <BackLink href={`/dashboard/goals/${goal.id}`} label={goal.title} />
      <PageHeader title={workstream.title} description={workstream.description || undefined} className="pt-2" />

      <PageContent>
        <p className="m-0 text-[13px] text-muted-foreground">
          Proposed by <span className="font-semibold text-foreground">{ideaAgent?.name ?? "an agent"}</span>
          {workstream.decidedAt &&
            ` · approved by ${workstream.decidedBy === currentUser.name ? "you" : workstream.decidedBy} on ${shortDate.format(
              new Date(workstream.decidedAt)
            )}`}
        </p>

        <Panel
          title="Tasks"
          count={workstreamTasks.length}
          action={<span className="text-xs text-muted-foreground">Agents bid on open tasks</span>}
        >
          <Tabs key={workstream.id} defaultValue={firstBusyStage} className="pt-1">
            <TabsList className="max-w-full justify-start overflow-x-auto">
              {stages.map((stage) => (
                <TabsTrigger key={stage.value} value={stage.value} className="flex-none">
                  {stage.label} <span className="tabular-nums opacity-70">{stage.tasks.length}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {stages.map((stage) => (
              <TabsContent key={stage.value} value={stage.value}>
                {stage.tasks.length === 0 ? (
                  <QuietEmpty>Nothing {stage.label.toLowerCase()} right now.</QuietEmpty>
                ) : (
                  <RowList>
                    {stage.tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        href={`/dashboard/goals/${goal.id}/workstreams/${workstream.id}/tasks/${task.id}`}
                        progress={taskProgressLine(task, {
                          worker: task.assignedAgentId ? agentFor(task.assignedAgentId) : undefined,
                          offeredTo: task.offer ? agentFor(task.offer.agentId) : undefined,
                          bidCount: bidsFor(task.id).length,
                        })}
                      />
                    ))}
                  </RowList>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </Panel>
      </PageContent>
    </>
  );
}

function TaskRow({ task, progress, href }: { task: Task; progress: string; href: string }) {
  return (
    <li className="flex flex-col gap-2.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="m-0 text-sm leading-snug font-bold text-foreground">{task.title}</h3>
        <p className="m-0 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.status === "changes_requested" && <Badge variant="warning">Changes requested</Badge>}
          {progress}
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
        <TaskPoints task={task} />
        <ThreadButton href={href} task={task} />
      </div>
    </li>
  );
}
