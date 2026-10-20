"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, BotIcon, CheckIcon, FolderTreeIcon, LightbulbIcon, LockIcon, TargetIcon, XIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { KpiCard, KpiGrid } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shortDate, shortDateTime, summarizeGoal, type Agent, type Idea } from "./goal-model";
import { TaskProgress } from "./GoalParts";
import { useGoals } from "./GoalsProvider";
import { RejectIdeaDialog } from "./RejectIdeaDialog";

export function GoalDetailView({ goalId }: { goalId: string }) {
  const { goals, ideas, currentUser, agentFor, approveIdea, rejectIdea } = useGoals();
  const [rejecting, setRejecting] = useState<Idea | null>(null);

  const goal = goals.find((candidate) => candidate.id === goalId);
  const goalIdeas = useMemo(
    () =>
      ideas
        .filter((idea) => idea.goalId === goalId)
        .sort((a, b) => Date.parse(b.proposedAt) - Date.parse(a.proposedAt)),
    [ideas, goalId]
  );

  if (!goal) {
    return (
      <>
        <BackLink />
        <PageHeader title="Goal not found" className="pt-2" />
        <PageContent>
          <section className="rounded-[22px] border border-border bg-card p-5">
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia className="size-12 rounded-full bg-accent text-primary-deep">
                  <TargetIcon className="size-5" aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>This goal doesn&rsquo;t exist</EmptyTitle>
                <EmptyDescription>It may have been created in another session. Demo goals reset on refresh.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/goals">Back to goals</Link>
                </Button>
              </EmptyContent>
            </Empty>
          </section>
        </PageContent>
      </>
    );
  }

  const isOwner = goal.ownerId === currentUser.id;
  const summary = summarizeGoal(goal.id, ideas);
  const proposed = goalIdeas.filter((idea) => idea.status === "proposed");
  const rejected = goalIdeas.filter((idea) => idea.status === "rejected");
  const workstreams = goalIdeas
    .filter((idea) => idea.status === "accepted")
    .sort((a, b) => Date.parse(b.decidedAt ?? b.proposedAt) - Date.parse(a.decidedAt ?? a.proposedAt));

  return (
    <>
      <BackLink />
      <PageHeader title={goal.title} description={goal.description || undefined} className="pt-2" />

      <PageContent>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted-foreground">
          <Badge variant="secondary">{goal.type}</Badge>
          <span>
            Owned by <span className="font-semibold text-foreground">{isOwner ? "you" : goal.ownerName}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>Created {shortDate.format(new Date(goal.createdAt))}</span>
          {!isOwner && (
            <span className="inline-flex items-center gap-1.5">
              <LockIcon className="size-3.5" aria-hidden="true" />
              Only {goal.ownerName} can approve or reject ideas
            </span>
          )}
        </div>

        <KpiGrid>
          <KpiCard
            title="Ideas to review"
            value={summary.pendingIdeas.toString()}
            context={summary.pendingIdeas > 0 ? (isOwner ? "Waiting for you" : "Waiting for the owner") : "All reviewed"}
          />
          <KpiCard title="Workstreams" value={summary.workstreams.toString()} context="Accepted ideas" />
          <KpiCard title="Open tasks" value={summary.openTasks.toString()} context="Across all workstreams" />
          <KpiCard
            title="Points released"
            value={summary.pointsReleased.toLocaleString("en-GB")}
            context="From approved tasks"
          />
        </KpiGrid>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <section className="flex flex-col gap-4 rounded-[22px] border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-[17px] leading-tight font-bold tracking-[-0.02em] text-foreground">Ideas</h2>
              <p className="m-0 text-[13px] text-muted-foreground">
                Approaches agents have proposed. An approved idea becomes a workstream that agents can add tasks to.
              </p>
            </div>

            <Tabs defaultValue="proposed">
              <TabsList>
                <TabsTrigger value="proposed">Proposed · {proposed.length}</TabsTrigger>
                <TabsTrigger value="rejected">Rejected · {rejected.length}</TabsTrigger>
              </TabsList>

              <TabsContent value="proposed" className="pt-2">
                {proposed.length === 0 ? (
                  <IdeasEmpty
                    title="No ideas waiting"
                    description="When an agent proposes an approach to this goal, it shows up here for review."
                  />
                ) : (
                  <ul className="m-0 flex list-none flex-col p-0">
                    {proposed.map((idea) => (
                      <IdeaRow key={idea.id} idea={idea} agent={agentFor(idea.agentId)}>
                        {isOwner && (
                          <div className="flex shrink-0 gap-2">
                            <Button variant="outline" size="sm" onClick={() => setRejecting(idea)}>
                              <XIcon data-icon="inline-start" aria-hidden="true" />
                              Reject
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => approveIdea(idea.id)}>
                              <CheckIcon data-icon="inline-start" aria-hidden="true" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </IdeaRow>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="pt-2">
                {rejected.length === 0 ? (
                  <IdeasEmpty title="Nothing rejected" description="Rejected ideas stay here so agents don't propose them again." />
                ) : (
                  <ul className="m-0 flex list-none flex-col p-0">
                    {rejected.map((idea) => (
                      <IdeaRow key={idea.id} idea={idea} agent={agentFor(idea.agentId)}>
                        <div className="flex flex-col gap-2 sm:max-w-[260px]">
                          <Badge variant="destructive">Rejected</Badge>
                          <p className="m-0 text-xs text-muted-foreground">
                            by {idea.decidedBy === currentUser.name ? "you" : idea.decidedBy}
                            {idea.decidedAt && ` · ${shortDate.format(new Date(idea.decidedAt))}`}
                          </p>
                        </div>
                      </IdeaRow>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </section>

          <section className="flex flex-col gap-4 rounded-[22px] border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="m-0 text-[17px] leading-tight font-bold tracking-[-0.02em] text-foreground">Workstreams</h2>
              <span className="text-[13px] text-muted-foreground tabular-nums">{workstreams.length}</span>
            </div>

            {workstreams.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia className="size-12 rounded-full bg-accent text-primary-deep">
                    <FolderTreeIcon className="size-5" aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No workstreams yet</EmptyTitle>
                  <EmptyDescription>Approve an idea and it becomes a workstream here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {workstreams.map((workstream) => (
                  <WorkstreamRow
                    key={workstream.id}
                    workstream={workstream}
                    agent={agentFor(workstream.agentId)}
                    approvedBy={workstream.decidedBy === currentUser.name ? "you" : workstream.decidedBy}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </PageContent>

      <RejectIdeaDialog
        idea={rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        onReject={(reason) => rejecting && rejectIdea(rejecting.id, reason)}
      />
    </>
  );
}

function BackLink() {
  return (
    <div className="px-4 pt-6 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="-ml-3">
        <Link href="/dashboard/goals">
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Goals
        </Link>
      </Button>
    </div>
  );
}

function IdeasEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia className="size-12 rounded-full bg-accent text-primary-deep">
          <LightbulbIcon className="size-5" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function AgentLine({ agent, at }: { agent?: Agent; at: string }) {
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
      <span className="flex size-5 items-center justify-center rounded-full bg-accent text-primary-deep">
        <BotIcon className="size-3" aria-hidden="true" />
      </span>
      <span className="font-semibold text-foreground">{agent?.name ?? "Unknown agent"}</span>
      {agent && (
        <>
          <span>· {agent.speciality}</span>
          <span>· owned by {agent.ownerName}</span>
        </>
      )}
      <span>· {shortDateTime.format(new Date(at))}</span>
    </p>
  );
}

function IdeaRow({ idea, agent, children }: { idea: Idea; agent?: Agent; children?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="m-0 text-[15px] leading-snug font-bold text-foreground">{idea.title}</h3>
        {idea.description && <p className="m-0 text-sm text-muted-foreground">{idea.description}</p>}
        <AgentLine agent={agent} at={idea.proposedAt} />
        {idea.rejectionReason && (
          <p className="m-0 mt-1 rounded-xl bg-muted px-3 py-2 text-[13px] text-foreground">{idea.rejectionReason}</p>
        )}
      </div>
      {children}
    </li>
  );
}

function WorkstreamRow({ workstream, agent, approvedBy }: { workstream: Idea; agent?: Agent; approvedBy?: string }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary-deep">
          <FolderTreeIcon className="size-4.5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="m-0 text-sm leading-snug font-bold text-foreground">{workstream.title}</h3>
          <p className="m-0 text-xs text-muted-foreground">
            From {agent?.name ?? "an agent"}
            {approvedBy && ` · approved by ${approvedBy}`}
            {workstream.decidedAt && ` · ${shortDate.format(new Date(workstream.decidedAt))}`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{workstream.openTasks} open</Badge>
        <Badge variant="secondary">{workstream.pointsReleased} pts released</Badge>
      </div>
      <TaskProgress label={workstream.title} approved={workstream.approvedTasks} total={workstream.totalTasks} />
    </li>
  );
}
