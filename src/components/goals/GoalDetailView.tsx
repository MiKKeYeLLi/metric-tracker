"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckIcon, ChevronRightIcon, TargetIcon, XIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shortDate, summarizeTasks, type Agent, type Idea } from "./goal-model";
import { BackLink, ByAgent, NotFoundState, Progress, QuietEmpty, RejectedToggle, RowList } from "./GoalParts";
import { useGoals } from "./GoalsProvider";
import { RejectDialog } from "./RejectDialog";

export function GoalDetailView({ goalId }: { goalId: string }) {
  const { goals, ideas, tasks, currentUser, agentFor, approveIdea, rejectIdea } = useGoals();
  const [rejecting, setRejecting] = useState<Idea | null>(null);

  const goal = goals.find((candidate) => candidate.id === goalId);
  const goalIdeas = useMemo(
    () =>
      ideas
        .filter((idea) => idea.goalId === goalId)
        .sort((a, b) => Date.parse(b.decidedAt ?? b.proposedAt) - Date.parse(a.decidedAt ?? a.proposedAt)),
    [ideas, goalId]
  );

  if (!goal) {
    return (
      <NotFoundState
        title="Goal not found"
        description="It may have been created in another session. Demo goals reset on refresh."
        icon={TargetIcon}
        backHref="/dashboard/goals"
        backLabel="Back to goals"
      />
    );
  }

  const isOwner = goal.ownerId === currentUser.id;
  const proposed = goalIdeas.filter((idea) => idea.status === "proposed");
  const rejected = goalIdeas.filter((idea) => idea.status === "rejected");
  const workstreams = goalIdeas.filter((idea) => idea.status === "accepted");

  return (
    <>
      <BackLink href="/dashboard/goals" label="Goals" />
      <PageHeader title={goal.title} description={goal.description || undefined} className="pt-2" />

      <PageContent>
        <p className="m-0 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <Badge variant="secondary">{goal.type}</Badge>
          {isOwner ? "Your goal" : `${goal.ownerName}'s goal`} · created {shortDate.format(new Date(goal.createdAt))}
        </p>

        <section className="rounded-[22px] border border-border bg-card p-4 sm:p-5">
          <Tabs key={goal.id} defaultValue="workstreams">
            <TabsList>
              <TabsTrigger value="workstreams">
                Workstreams <span className="tabular-nums opacity-70">{workstreams.length}</span>
              </TabsTrigger>
              <TabsTrigger value="ideas">
                Ideas{" "}
                {isOwner && proposed.length > 0 ? (
                  <span className="rounded-full bg-warning-muted px-1.5 text-xs font-semibold text-warning tabular-nums">
                    {proposed.length}
                  </span>
                ) : (
                  <span className="tabular-nums opacity-70">{proposed.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workstreams">
              {workstreams.length === 0 ? (
                <QuietEmpty>Approved ideas become workstreams, where agents add tasks.</QuietEmpty>
              ) : (
                <RowList>
                  {workstreams.map((workstream) => {
                    const summary = summarizeTasks(tasks.filter((task) => task.workstreamId === workstream.id));
                    return (
                      <li key={workstream.id}>
                        <Link
                          href={`/dashboard/goals/${goal.id}/workstreams/${workstream.id}`}
                          className="-mx-2 grid gap-2 rounded-xl px-2 py-3.5 text-inherit no-underline transition-colors outline-none hover:bg-accent/45 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_160px_16px] sm:items-center sm:gap-5"
                        >
                          <div className="flex min-w-0 flex-col gap-1">
                            <h3 className="m-0 truncate text-[15px] leading-snug font-bold text-foreground">{workstream.title}</h3>
                            <p className="m-0 truncate text-xs text-muted-foreground">
                              {summary.openTasks} open · {summary.activeTasks} in progress
                            </p>
                          </div>
                          <Progress label={workstream.title} done={summary.approvedTasks} total={summary.totalTasks} />
                          <ChevronRightIcon className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </RowList>
              )}
            </TabsContent>

            <TabsContent value="ideas">
              {!isOwner && (
                <p className="m-0 pt-2 text-xs text-muted-foreground">Only {goal.ownerName} can approve or reject ideas.</p>
              )}
              {proposed.length === 0 ? (
                <QuietEmpty>No ideas waiting. When an agent proposes an approach, it appears here.</QuietEmpty>
              ) : (
                <RowList>
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
                </RowList>
              )}

              <RejectedToggle count={rejected.length}>
                <RowList>
                  {rejected.map((idea) => (
                    <IdeaRow key={idea.id} idea={idea} agent={agentFor(idea.agentId)} />
                  ))}
                </RowList>
              </RejectedToggle>
            </TabsContent>
          </Tabs>
        </section>
      </PageContent>

      <RejectDialog
        item={rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        onReject={(reason) => rejecting && rejectIdea(rejecting.id, reason)}
      />
    </>
  );
}

function IdeaRow({ idea, agent, children }: { idea: Idea; agent?: Agent; children?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="m-0 text-[15px] leading-snug font-bold text-foreground">{idea.title}</h3>
        {idea.description && <p className="m-0 max-w-[68ch] text-sm text-muted-foreground">{idea.description}</p>}
        <ByAgent agent={agent} at={idea.proposedAt} />
        {idea.rejectionReason && (
          <p className="m-0 mt-1 max-w-[68ch] rounded-xl bg-muted px-3 py-2 text-[13px] text-foreground">
            {idea.rejectionReason}
          </p>
        )}
      </div>
      {children}
    </li>
  );
}
