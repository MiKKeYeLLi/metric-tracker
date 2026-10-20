"use client";

import { useMemo, useState } from "react";
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
import { DEMO_GOALS, GOAL_TYPES, type Goal } from "./goal-model";
import { GoalFormDialog, type NewGoal } from "./GoalFormDialog";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function GoalsView({ currentUserName }: { currentUserName: string }) {
  const [goals, setGoals] = useState<Goal[]>(DEMO_GOALS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  const stats = useMemo(
    () => ({
      goals: goals.length,
      pendingIdeas: goals.reduce((sum, goal) => sum + goal.pendingIdeas, 0),
      openTasks: goals.reduce((sum, goal) => sum + goal.openTasks, 0),
      points: goals.reduce((sum, goal) => sum + goal.pointsReleased, 0),
    }),
    [goals]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return goals.filter(
      (goal) =>
        (typeFilter === "all" || goal.type === typeFilter) &&
        (!query || goal.title.toLowerCase().includes(query) || goal.description.toLowerCase().includes(query))
    );
  }, [goals, search, typeFilter]);

  const createGoal = (input: NewGoal) => {
    const goal: Goal = {
      ...input,
      id: `goal_${Date.now()}`,
      createdBy: currentUserName,
      createdAt: new Date().toISOString(),
      workstreams: 0,
      pendingIdeas: 0,
      openTasks: 0,
      approvedTasks: 0,
      totalTasks: 0,
      pointsReleased: 0,
    };
    setGoals((previous) => [goal, ...previous]);
  };

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
                  <GoalTile goal={goal} />
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

function GoalTile({ goal }: { goal: Goal }) {
  const progress = goal.totalTasks === 0 ? 0 : Math.round((goal.approvedTasks / goal.totalTasks) * 100);

  return (
    <article className="grid gap-4 rounded-2xl border border-border p-4 transition-colors hover:border-border-strong lg:grid-cols-[minmax(0,1fr)_auto_220px] lg:items-center lg:gap-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary-deep">
          <TargetIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-[15px] leading-snug font-bold text-foreground">{goal.title}</h3>
            <Badge variant="secondary">{goal.type}</Badge>
          </div>
          {goal.description && <p className="m-0 line-clamp-2 text-sm text-muted-foreground">{goal.description}</p>}
          <p className="m-0 text-xs text-muted-foreground">
            {goal.createdBy} · {dateFormat.format(new Date(goal.createdAt))}
          </p>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-3 gap-2 lg:w-[330px]">
        <GoalStat icon={FolderTreeIcon} label="Workstreams" value={goal.workstreams} />
        <GoalStat icon={LightbulbIcon} label="Ideas" value={goal.pendingIdeas} />
        <GoalStat icon={ListTodoIcon} label="Open tasks" value={goal.openTasks} />
      </dl>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-foreground">Tasks approved</span>
          <span className="font-semibold text-primary-deep tabular-nums">
            {goal.approvedTasks} / {goal.totalTasks}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-chart-track"
          role="progressbar"
          aria-label={`${goal.title}: tasks approved`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </article>
  );
}

function GoalStat({ icon: Icon, label, value }: { icon: typeof TargetIcon; label: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-muted px-3 py-2">
      <dt className="flex items-center gap-1 truncate text-2xs font-bold tracking-[0.07em] text-muted-foreground uppercase">
        <Icon className="size-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="m-0 text-lg leading-none font-extrabold text-foreground tabular-nums">{value}</dd>
    </div>
  );
}
