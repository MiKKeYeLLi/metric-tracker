"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRightIcon, PlusIcon, TargetIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
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
import { GOAL_TYPES, summarizeGoal, type Goal, type GoalSummary } from "./goal-model";
import { GoalFormDialog } from "./GoalFormDialog";
import { Panel, Progress, RowList } from "./GoalParts";
import { useGoals } from "./GoalsProvider";

export function GoalsView() {
  const { goals, ideas, tasks, currentUser, createGoal } = useGoals();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

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
      <PageHeader title="Goals" description="What the team is working towards. Agents propose the ideas and tasks to get there." />

      <PageContent>
        <Toolbar>
          <ToolbarGroup>
            <SearchPill value={search} onChange={setSearch} placeholder="Search goals" />
            <PillSelect
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[{ value: "all", label: "All" }, ...GOAL_TYPES.map((type) => ({ value: type, label: type }))]}
            />
          </ToolbarGroup>
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            New goal
          </Button>
        </Toolbar>

        <Panel title="Goals" count={filtering ? filtered.length : goals.length}>
          {filtered.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia className="size-12 rounded-full bg-accent text-primary-deep">
                  <TargetIcon className="size-5" aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>{filtering ? "No goals match" : "No goals yet"}</EmptyTitle>
                <EmptyDescription>
                  {filtering ? "Try a different search or type." : "Create a goal so agents know what to work towards."}
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
            <RowList>
              {filtered.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  summary={summarizeGoal(goal.id, ideas, tasks)}
                  ownedByYou={goal.ownerId === currentUser.id}
                />
              ))}
            </RowList>
          )}
        </Panel>
      </PageContent>

      <GoalFormDialog open={formOpen} onOpenChange={setFormOpen} onCreate={createGoal} />
    </>
  );
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function GoalRow({ goal, summary, ownedByYou }: { goal: Goal; summary: GoalSummary; ownedByYou: boolean }) {
  const needsYou = ownedByYou && summary.pendingIdeas > 0;

  return (
    <li>
      <Link
        href={`/dashboard/goals/${goal.id}`}
        className="-mx-2 grid gap-2 rounded-xl px-2 py-3.5 text-inherit no-underline transition-colors outline-none hover:bg-accent/45 focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_auto_160px_16px] sm:items-center sm:gap-5"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="m-0 truncate text-[15px] leading-snug font-bold text-foreground">{goal.title}</h3>
            <Badge variant="secondary">{goal.type}</Badge>
          </div>
          <p className="m-0 truncate text-xs text-muted-foreground">
            {ownedByYou ? "Yours" : goal.ownerName} · {plural(summary.workstreams, "workstream")} ·{" "}
            {plural(summary.openTasks, "open task")}
          </p>
        </div>
        <div className="sm:justify-self-end">
          {needsYou ? (
            <Badge variant="warning">{plural(summary.pendingIdeas, "idea")} to review</Badge>
          ) : summary.pendingIdeas > 0 ? (
            <span className="text-xs text-muted-foreground">{plural(summary.pendingIdeas, "idea")} proposed</span>
          ) : null}
        </div>
        <Progress label={goal.title} done={summary.approvedTasks} total={summary.totalTasks} />
        <ChevronRightIcon className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
      </Link>
    </li>
  );
}
