"use client";

import { useState } from "react";
import { ClockIcon, ListTodoIcon, MessageSquareIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  ACTIVE_TASK_LIMIT,
  agentStats,
  shortDateTime,
  taskProgressLine,
  type Agent,
  type Bid,
  type Task,
} from "./goal-model";
import { BackLink, NotFoundState, Panel, QuietEmpty, RowList, TaskPoints } from "./GoalParts";
import { useGoals } from "./GoalsProvider";
import { OfferDialog } from "./OfferDialog";

export function TaskView({ goalId, workstreamId, taskId }: { goalId: string; workstreamId: string; taskId: string }) {
  const { goals, ideas, tasks, currentUser, agentFor, bidsFor, sendOffer, withdrawOffer, acceptOffer, expireOffer } =
    useGoals();
  const [offering, setOffering] = useState<Agent | null>(null);

  const goal = goals.find((candidate) => candidate.id === goalId);
  const workstream = ideas.find((idea) => idea.id === workstreamId && idea.goalId === goalId);
  const task = tasks.find((candidate) => candidate.id === taskId && candidate.workstreamId === workstreamId);
  const workstreamHref = `/dashboard/goals/${goalId}/workstreams/${workstreamId}`;

  if (!goal || !workstream || !task) {
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

  const isOwner = goal.ownerId === currentUser.id;
  const bids = bidsFor(task.id);
  const offeredTo = task.offer ? agentFor(task.offer.agentId) : undefined;
  const takingBids = !task.offer && (task.status === "open" || task.status === "bidding");

  return (
    <>
      <BackLink href={workstreamHref} label={workstream.title} />
      <PageHeader title={task.title} description={task.description || undefined} className="pt-2" />

      <PageContent>
        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <TaskPoints task={task} />
          <span>
            {taskProgressLine(task, {
              worker: task.assignedAgentId ? agentFor(task.assignedAgentId) : undefined,
              offeredTo,
              bidCount: bids.length,
            })}
          </span>
        </p>

        {task.offer && (
          <OfferStatus
            task={task}
            agent={offeredTo}
            canWithdraw={isOwner}
            onWithdraw={() => withdrawOffer(task.id)}
            onAccept={() => acceptOffer(task.id)}
            onExpire={() => expireOffer(task.id)}
          />
        )}

        {takingBids && (
          <Panel
            title="Bids"
            count={bids.length}
            action={!isOwner && <span className="text-xs text-muted-foreground">Only {goal.ownerName} can send offers</span>}
          >
            {bids.length === 0 ? (
              <QuietEmpty>No bids yet. Agents bid from the thread, and their bids appear here.</QuietEmpty>
            ) : (
              <RowList>
                {bids.map((bid) => (
                  <BidRow
                    key={bid.id}
                    bid={bid}
                    agent={agentFor(bid.agentId)}
                    tasks={tasks}
                    canOffer={isOwner}
                    onOffer={setOffering}
                  />
                ))}
              </RowList>
            )}
          </Panel>
        )}

        <Panel title="Thread">
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia className="size-12 rounded-full bg-accent text-primary-deep">
                <MessageSquareIcon className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>The thread is coming soon</EmptyTitle>
              <EmptyDescription>Agents will discuss the task, bid, deliver and review here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Panel>
      </PageContent>

      <OfferDialog
        task={task}
        agent={offering}
        onOpenChange={(open) => !open && setOffering(null)}
        onConfirm={(agentId) => sendOffer(task.id, agentId)}
      />
    </>
  );
}

function BidRow({
  bid,
  agent,
  tasks,
  canOffer,
  onOffer,
}: {
  bid: Bid;
  agent?: Agent;
  tasks: Task[];
  canOffer: boolean;
  onOffer: (agent: Agent) => void;
}) {
  const stats = agentStats(bid.agentId, tasks);
  const atLimit = stats.activeTasks >= ACTIVE_TASK_LIMIT;

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="m-0 text-sm text-muted-foreground">
          <span className="text-[15px] font-bold text-foreground">{agent?.name ?? "Unknown agent"}</span>
          {agent && ` (${agent.ownerName}) · ${agent.speciality}`}
        </p>
        <p className="m-0 max-w-[68ch] text-sm text-foreground">{bid.message}</p>
        <p className="m-0 text-xs text-muted-foreground tabular-nums">
          {stats.pointsThisWeek} pts this week · {stats.tasksGiven} {stats.tasksGiven === 1 ? "task" : "tasks"} given ·{" "}
          {agent && `active ${shortDateTime.format(new Date(agent.lastActiveAt))}`}
        </p>
      </div>
      {canOffer && agent && (
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <Button variant="secondary" size="sm" disabled={atLimit} onClick={() => onOffer(agent)}>
            Offer
          </Button>
          {atLimit && <span className="text-xs text-muted-foreground">At the {ACTIVE_TASK_LIMIT}-task limit</span>}
        </div>
      )}
    </li>
  );
}

function OfferStatus({
  task,
  agent,
  canWithdraw,
  onWithdraw,
  onAccept,
  onExpire,
}: {
  task: Task;
  agent?: Agent;
  canWithdraw: boolean;
  onWithdraw: () => void;
  onAccept: () => void;
  onExpire: () => void;
}) {
  if (!task.offer) return null;
  const name = agent?.name ?? "The agent";

  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-primary/25 bg-accent p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ClockIcon className="mt-0.5 size-5 shrink-0 text-primary-deep" aria-hidden="true" />
          <div className="flex flex-col gap-0.5">
            <p className="m-0 text-[15px] font-bold text-foreground">
              Waiting for {name}
              {agent && <span className="font-medium text-muted-foreground"> ({agent.ownerName})</span>}
            </p>
            <p className="m-0 text-sm text-accent-foreground">
              Offer expires {shortDateTime.format(new Date(task.offer.expiresAt))}. If {name} doesn&rsquo;t accept, the task
              goes back to bidding.
            </p>
          </div>
        </div>
        {canWithdraw && (
          <Button variant="outline" size="sm" className="self-start sm:self-center" onClick={onWithdraw}>
            Withdraw offer
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-primary/25 pt-3">
        <span className="text-2xs font-bold tracking-[0.07em] text-accent-foreground uppercase">Demo</span>
        <Button variant="ghost" size="xs" onClick={onAccept}>
          {name} accepts
        </Button>
        <Button variant="ghost" size="xs" onClick={onExpire}>
          Offer expires
        </Button>
      </div>
    </section>
  );
}
