"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, LayersIcon, LightbulbIcon, TargetIcon, XIcon, type LucideIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { shortDate, summarizeGoal, summarizeTasks, type Agent, type Idea } from "./goal-model";
import { BackLink, ByAgent, NotFoundState, OwnerAvatar, RejectedToggle, TaskProgress } from "./GoalParts";
import { useGoals } from "./GoalsProvider";
import { RejectDialog } from "./RejectDialog";

/**
 * Each kind of item keeps one colour everywhere on the page, tabs included:
 * workstreams are violet (approved, being worked), ideas are amber (waiting on a decision), rejected ideas are red.
 */
const KINDS = {
  workstream: { icon: LayersIcon, chip: "bg-accent text-primary-deep" },
  idea: { icon: LightbulbIcon, chip: "bg-warning-muted text-warning" },
  rejected: { icon: XIcon, chip: "bg-destructive-muted text-destructive" },
} satisfies Record<string, { icon: LucideIcon; chip: string }>;

type Kind = keyof typeof KINDS;

const CARD = "rounded-[22px] border border-border bg-card p-5 sm:p-6";

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
  const summary = summarizeGoal(goal.id, ideas, tasks);

  return (
    <>
      <BackLink href="/dashboard/goals" label="Goals" />
      <PageHeader title={goal.title} description={goal.description || undefined} className="pt-2" />

      <PageContent>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
            <OwnerAvatar name={goal.ownerName} image={isOwner ? currentUser.image : undefined} />
            <span className="font-semibold text-foreground">{isOwner ? "Your goal" : `${goal.ownerName}'s goal`}</span>·
            <span>{goal.type}</span>·<span>created {shortDate.format(new Date(goal.createdAt))}</span>
          </p>
          <div className="w-full lg:max-w-md">
            <TaskProgress label={goal.title} done={summary.approvedTasks} total={summary.totalTasks} />
          </div>
        </div>

        <Tabs key={goal.id} defaultValue="workstreams" className="gap-4">
          <TabsList className="h-11! self-start p-1">
            <TabTrigger value="workstreams" kind="workstream" label="Workstreams" count={workstreams.length} />
            <TabTrigger
              value="ideas"
              kind="idea"
              label="Ideas"
              count={proposed.length}
              highlight={isOwner && proposed.length > 0}
            />
          </TabsList>

          <TabsContent value="workstreams">
            {workstreams.length === 0 ? (
              <EmptyCard>Approved ideas become workstreams, where agents add tasks.</EmptyCard>
            ) : (
              <CardStack>
                {workstreams.map((workstream) => {
                  const work = summarizeTasks(tasks.filter((task) => task.workstreamId === workstream.id));
                  return (
                    <li key={workstream.id}>
                      <Link
                        href={`/dashboard/goals/${goal.id}/workstreams/${workstream.id}`}
                        className={cn(
                          CARD,
                          "group/item flex flex-col gap-5 text-inherit no-underline transition-colors duration-150 outline-none hover:border-border-strong focus-visible:ring-3 focus-visible:ring-ring/50 lg:flex-row lg:items-center lg:gap-10"
                        )}
                      >
                        <ItemHeading kind="workstream" title={workstream.title} interactive>
                          {workstream.description && <Description>{workstream.description}</Description>}
                          <p className="m-0 text-[13px] text-muted-foreground tabular-nums">
                            <span className="font-semibold text-foreground">{work.openTasks} open</span> ·{" "}
                            {work.activeTasks} in progress · from {agentFor(workstream.agentId)?.name ?? "an agent"}&rsquo;s
                            idea
                          </p>
                        </ItemHeading>
                        <div className="flex items-center gap-5 lg:w-[340px] lg:shrink-0">
                          <div className="min-w-0 flex-1">
                            <TaskProgress label={workstream.title} done={work.approvedTasks} total={work.totalTasks} />
                          </div>
                          <ArrowRightIcon
                            className="hidden size-5 shrink-0 text-muted-foreground transition-[color,translate] duration-150 group-hover/item:translate-x-0.5 group-hover/item:text-primary-deep lg:block"
                            aria-hidden="true"
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </CardStack>
            )}
          </TabsContent>

          <TabsContent value="ideas" className="flex flex-col gap-4">
            {!isOwner && proposed.length > 0 && (
              <p className="m-0 text-[13px] text-muted-foreground">Only {goal.ownerName} can approve or reject ideas.</p>
            )}
            {proposed.length === 0 ? (
              <EmptyCard>No ideas waiting. When an agent proposes an approach, it appears here.</EmptyCard>
            ) : (
              <CardStack>
                {proposed.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} agent={agentFor(idea.agentId)}>
                    {isOwner ? (
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" onClick={() => setRejecting(idea)}>
                          <XIcon data-icon="inline-start" aria-hidden="true" />
                          Reject
                        </Button>
                        <Button variant="secondary" onClick={() => approveIdea(idea.id)}>
                          <CheckIcon data-icon="inline-start" aria-hidden="true" />
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="warning" className="self-start">
                        Waiting for {goal.ownerName}
                      </Badge>
                    )}
                  </IdeaCard>
                ))}
              </CardStack>
            )}

            <RejectedToggle count={rejected.length}>
              <CardStack>
                {rejected.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} agent={agentFor(idea.agentId)} />
                ))}
              </CardStack>
            </RejectedToggle>
          </TabsContent>
        </Tabs>
      </PageContent>

      <RejectDialog
        item={rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        onReject={(reason) => rejecting && rejectIdea(rejecting.id, reason)}
      />
    </>
  );
}

function TabTrigger({
  value,
  kind,
  label,
  count,
  highlight = false,
}: {
  value: string;
  kind: Kind;
  label: string;
  count: number;
  highlight?: boolean;
}) {
  const Icon = KINDS[kind].icon;

  return (
    <TabsTrigger value={value} className="gap-2 px-4 text-sm">
      <span className={cn("flex size-6 items-center justify-center rounded-full", KINDS[kind].chip)}>
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      {label}
      <span
        className={cn(
          "tabular-nums",
          highlight ? "rounded-full bg-warning-muted px-1.5 text-xs font-semibold text-warning" : "opacity-70"
        )}
      >
        {count}
      </span>
    </TabsTrigger>
  );
}

function CardStack({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 flex list-none flex-col gap-3 p-0">{children}</ul>;
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 rounded-[22px] border border-dashed border-border-strong px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function Description({ children }: { children: React.ReactNode }) {
  return <p className="m-0 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

/** The icon chip in the item's colour, then its title and supporting lines. */
function ItemHeading({
  kind,
  title,
  interactive = false,
  children,
}: {
  kind: Kind;
  title: string;
  interactive?: boolean;
  children?: React.ReactNode;
}) {
  const Icon = KINDS[kind].icon;

  return (
    <div className="flex min-w-0 flex-1 items-start gap-4">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", KINDS[kind].chip)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5 pt-0.5">
        <h3
          className={cn(
            "m-0 text-lg leading-snug font-bold tracking-[-0.02em] text-balance",
            kind === "rejected" ? "text-muted-foreground" : "text-foreground",
            interactive && "transition-colors group-hover/item:text-primary-deep"
          )}
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function IdeaCard({ idea, agent, children }: { idea: Idea; agent?: Agent; children?: React.ReactNode }) {
  const rejected = idea.status === "rejected";

  return (
    <li className={cn(CARD, "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8")}>
      <ItemHeading kind={rejected ? "rejected" : "idea"} title={idea.title}>
        {idea.description && <Description>{idea.description}</Description>}
        <ByAgent agent={agent} at={idea.proposedAt} />
        {rejected && (
          <p className="m-0 mt-2 max-w-[68ch] self-start rounded-xl bg-destructive-muted px-3.5 py-2.5 text-[13px] text-foreground">
            <span className="font-semibold text-destructive">
              Rejected{idea.decidedBy ? ` by ${idea.decidedBy}` : ""}
              {idea.rejectionReason ? ": " : ""}
            </span>
            {idea.rejectionReason}
          </p>
        )}
      </ItemHeading>
      {children}
    </li>
  );
}
