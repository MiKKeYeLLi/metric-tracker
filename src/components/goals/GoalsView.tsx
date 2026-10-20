"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderTreeIcon, LightbulbIcon, ListTodoIcon, PlusIcon, TargetIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { KpiCard, KpiGrid } from "@/components/KpiCard";
import { PillSelect, SearchPill, Toolbar, ToolbarGroup } from "@/components/Toolbar";
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
import { GOAL_TYPES, shortDate, summarizeGoal, type Goal, type GoalSummary } from "./goal-model";
import { GoalFormDialog } from "./GoalFormDialog";
import { GoalStat, TaskProgress } from "./GoalParts";
import { useGoals } from "./GoalsProvider";

export function GoalsView() {
  const { goals, ideas, currentUser, createGoal } = useGoals();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  const summaries = useMemo(
    () => new Map(goals.map((goal) => [goal.id, summarizeGoal(goal.id, ideas)])),
    [goals, ideas]
  );

  const stats = useMemo(() => {
    const all = Array.from(summaries.values());
    const sum = (key: keyof GoalSummary) => all.reduce((total, summary) => total + summary[key], 0);
    return {
      goals: goals.length,
      pendingIdeas: sum("pendingIdeas"),
      openTasks: sum("openTasks"),
      points: sum("pointsReleased"),
    };
  }, [goals, summaries]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return goals.filter(
      (goal) =>
        (typeFilter === "all" || goal.type === typeFilter) &&
        (!query || goal.title.toLowerCase().includes(query) || goal.description.toLowerCase().includes(query))
    );
  }, [goals, search, typeFilter]);

  const filtering = search !== "" || typeFilter !== "all";

  return (
    <>
      <PageHeader title="Goals" description="Set the outcomes. Agents propose ideas and tasks to reach them." />

      <PageContent>
        <Toolbar>
          <ToolbarGroup>
            <SearchPill value={search} onChange={setSearch} placeholder="Search goals" />
            <PillSelect
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All" },
                ...GOAL_TYPES.map((type) => ({ value: type, label: type })),
              ]}
            />
          </ToolbarGroup>
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            New goal
          </Button>
        </Toolbar>

        <KpiGrid>
          <KpiCard title="Active goals" value={stats.goals.toString()} context="Across the Zedu project" />
          <KpiCard title="Ideas to review" value={stats.pendingIdeas.toString()} context="Waiting for a human" />
          <KpiCard title="Open tasks" value={stats.openTasks.toString()} context="Ready for agents to bid" />
          <KpiCard title="Points released" value={stats.points.toLocaleString("en-GB")} context="From approved tasks" />
        </KpiGrid>

        <section className="flex flex-col gap-4 rounded-[22px] border border-border bg-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="m-0 text-[17px] leading-tight font-bold tracking-[-0.02em] text-foreground">All goals</h2>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {filtering ? `${filtered.length} of ${goals.length}` : goals.length}{" "}
              {goals.length === 1 ? "goal" : "goals"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia className="size-12 rounded-full bg-accent text-primary-deep">
                  <TargetIcon className="size-5" aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>{filtering ? "No goals match" : "No goals yet"}</EmptyTitle>
                <EmptyDescription>
                  {filtering
                    ? "Try a different search or type."
                    : "Create the first goal so agents know what to work towards."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {filtering ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setFormOpen(true)}>
                    <PlusIcon data-icon="inline-start" aria-hidden="true" />
                    New goal
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {filtered.map((goal) => (
                <li key={goal.id}>
                  <GoalTile
                    goal={goal}
                    summary={summaries.get(goal.id) ?? summarizeGoal(goal.id, ideas)}
                    ownedByYou={goal.ownerId === currentUser.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageContent>

      <GoalFormDialog open={formOpen} onOpenChange={setFormOpen} onCreate={createGoal} />
    </>
  );
}

function GoalTile({ goal, summary, ownedByYou }: { goal: Goal; summary: GoalSummary; ownedByYou: boolean }) {
  return (
    <Link
      href={`/dashboard/goals/${goal.id}`}
      className="grid gap-4 rounded-2xl border border-border p-4 text-inherit no-underline transition-colors outline-none hover:border-border-strong hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 lg:grid-cols-[minmax(0,1fr)_auto_220px] lg:items-center lg:gap-6"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary-deep">
          <TargetIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-[15px] leading-snug font-bold text-foreground">{goal.title}</h3>
            <Badge variant="secondary">{goal.type}</Badge>
            {summary.pendingIdeas > 0 && ownedByYou && <Badge variant="warning">Needs your review</Badge>}
          </div>
          {goal.description && <p className="m-0 line-clamp-2 text-sm text-muted-foreground">{goal.description}</p>}
          <p className="m-0 text-xs text-muted-foreground">
            {ownedByYou ? "You" : goal.ownerName} · {shortDate.format(new Date(goal.createdAt))}
          </p>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-3 gap-2 lg:w-[330px]">
        <GoalStat icon={FolderTreeIcon} label="Workstreams" value={summary.workstreams} />
        <GoalStat icon={LightbulbIcon} label="Ideas" value={summary.pendingIdeas} />
        <GoalStat icon={ListTodoIcon} label="Open tasks" value={summary.openTasks} />
      </dl>

      <TaskProgress label={goal.title} approved={summary.approvedTasks} total={summary.totalTasks} />
    </Link>
  );
}
