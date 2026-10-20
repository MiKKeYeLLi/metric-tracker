"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CalendarIcon,
  CheckCircle2Icon,
  CheckSquareIcon,
  ClockIcon,
  MailIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { KpiCard, KpiGrid } from "@/components/KpiCard";
import { PillSelect, SearchPill, Toolbar, ToolbarGroup } from "@/components/Toolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TaskType } from "@prisma/client";
import { TaskFormDialog, type TaskApiItem } from "./TaskFormDialog";
import { TaskDeleteDialog } from "./TaskDeleteDialog";

const TYPE_CONFIG: Record<TaskType, { label: string; icon: LucideIcon; badgeVariant: "secondary" | "outline" | "default" }> = {
  FollowUp: { label: "Follow-up", icon: CalendarIcon, badgeVariant: "secondary" },
  Call: { label: "Call", icon: PhoneIcon, badgeVariant: "outline" },
  Email: { label: "Email", icon: MailIcon, badgeVariant: "outline" },
  Meeting: { label: "Meeting", icon: MessageSquareIcon, badgeVariant: "secondary" },
  Other: { label: "Other", icon: CheckSquareIcon, badgeVariant: "secondary" },
};

type TabFilter = "open" | "today" | "overdue" | "upcoming" | "completed" | "all";

function getDueInfo(dueAtIso: string, done: boolean) {
  const due = new Date(dueAtIso);
  const now = new Date();

  const nowDate = now.toISOString().slice(0, 10);
  const dueDate = due.toISOString().slice(0, 10);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const timeStr = due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const dateStr = due.toLocaleDateString([], { month: "short", day: "numeric" });

  if (done) {
    return {
      label: `Done · ${dateStr}`,
      tone: "muted" as const,
      isOverdue: false,
    };
  }

  if (dueDate < nowDate) {
    const diffDays = Math.max(1, Math.round((Date.parse(nowDate) - Date.parse(dueDate)) / 86400000));
    return {
      label: `${diffDays}d overdue · ${dateStr}`,
      tone: "destructive" as const,
      isOverdue: true,
    };
  }

  if (dueDate === nowDate) {
    return {
      label: `Today · ${timeStr}`,
      tone: "warning" as const,
      isOverdue: false,
    };
  }

  if (dueDate === tomorrow) {
    return {
      label: `Tomorrow · ${timeStr}`,
      tone: "info" as const,
      isOverdue: false,
    };
  }

  return {
    label: `${dateStr} · ${timeStr}`,
    tone: "neutral" as const,
    isOverdue: false,
  };
}

export function TasksView({ currentUserId }: { currentUserId?: string }) {
  const [tasks, setTasks] = useState<TaskApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskApiItem | null>(null);
  const [deleteTask, setDeleteTask] = useState<TaskApiItem | null>(null);

  const loadTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const stats = useMemo(() => {
    const nowIsoDate = new Date().toISOString().slice(0, 10);
    const open = tasks.filter((t) => !t.done);
    const completed = tasks.filter((t) => t.done);
    const overdue = open.filter((t) => t.dueAt.slice(0, 10) < nowIsoDate);
    const today = open.filter((t) => t.dueAt.slice(0, 10) === nowIsoDate);

    return {
      openCount: open.length,
      overdueCount: overdue.length,
      todayCount: today.length,
      completedCount: completed.length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const nowIsoDate = new Date().toISOString().slice(0, 10);
    const query = searchQuery.toLowerCase().trim();

    return tasks.filter((t) => {
      // Search filter
      if (query && !t.title.toLowerCase().includes(query) && !(t.description && t.description.toLowerCase().includes(query))) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && t.type !== typeFilter) {
        return false;
      }

      // Assigned to me filter
      if (assignedToMeOnly && currentUserId && t.ownerId !== currentUserId) {
        return false;
      }

      // Tab filter
      const isOverdue = !t.done && t.dueAt.slice(0, 10) < nowIsoDate;
      const isToday = !t.done && t.dueAt.slice(0, 10) === nowIsoDate;
      const isUpcoming = !t.done && t.dueAt.slice(0, 10) > nowIsoDate;

      if (activeTab === "open") return !t.done;
      if (activeTab === "overdue") return isOverdue;
      if (activeTab === "today") return isToday;
      if (activeTab === "upcoming") return isUpcoming;
      if (activeTab === "completed") return t.done;
      return true;
    });
  }, [tasks, searchQuery, typeFilter, assignedToMeOnly, activeTab, currentUserId]);

  const handleToggle = async (task: TaskApiItem) => {
    const nextDone = !task.done;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, done: nextDone, completedAt: nextDone ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: nextDone }),
      });
      if (!res.ok) {
        // Revert on failure
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      }
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  };

  const handleSaved = (saved: TaskApiItem) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === saved.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleted = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Organize outreach follow-ups, PR action items, and team to-dos."
        actions={
          <Button
            onClick={() => {
              setTaskToEdit(null);
              setFormOpen(true);
            }}
            className="gap-2"
          >
            <PlusIcon className="size-4" />
            New task
          </Button>
        }
      />

      <PageContent className="flex flex-col gap-6">
        {/* KPI Cards */}
        <KpiGrid>
          <KpiCard title="Open Tasks" value={stats.openCount.toString()} context="Active action items" />
          <KpiCard
            title="Due Today"
            value={stats.todayCount.toString()}
            context={stats.todayCount > 0 ? "Needs attention today" : "All caught up for today"}
          />
          <KpiCard
            title="Overdue"
            value={stats.overdueCount.toString()}
            context={stats.overdueCount > 0 ? "Past target deadline" : "No overdue items"}
          />
          <KpiCard title="Completed" value={stats.completedCount.toString()} context="Finished tasks" />
        </KpiGrid>

        {/* Filters and Toolbar */}
        <Toolbar>
          <ToolbarGroup>
            <SearchPill value={searchQuery} onChange={setSearchQuery} placeholder="Search tasks..." />

            <PillSelect
              label="Type:"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All types" },
                { value: "FollowUp", label: "Follow-up" },
                { value: "Call", label: "Call" },
                { value: "Email", label: "Email" },
                { value: "Meeting", label: "Meeting" },
                { value: "Other", label: "Other" },
              ]}
            />

            <div className="flex h-10 items-center rounded-full border border-border bg-card px-4">
              <Checkbox
                checked={assignedToMeOnly}
                onChange={(e) => setAssignedToMeOnly(e.target.checked)}
                label="Assigned to me"
              />
            </div>
          </ToolbarGroup>

          {/* Tab Selector */}
          <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
            {(
              [
                { id: "open", label: "Open" },
                { id: "today", label: "Today" },
                { id: "overdue", label: "Overdue" },
                { id: "upcoming", label: "Upcoming" },
                { id: "completed", label: "Done" },
                { id: "all", label: "All" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeTab === t.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Toolbar>

        {/* Task List */}
        <div className="flex flex-col overflow-hidden rounded-[22px] border border-border bg-card shadow-xs">
          {loading ? (
            <div className="flex flex-col divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="size-5 rounded-md" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No tasks found</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery || typeFilter !== "all" || assignedToMeOnly
                      ? "No tasks match your current filters. Try resetting the filters or create a new task."
                      : "You have no tasks in this view. Click 'New task' above to add your first one."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <ul className="m-0 divide-y divide-border list-none p-0">
              {filteredTasks.map((task) => {
                const typeInfo = TYPE_CONFIG[task.type] ?? TYPE_CONFIG.Other;
                const TypeIcon = typeInfo.icon;
                const dueInfo = getDueInfo(task.dueAt, task.done);

                return (
                  <li
                    key={task.id}
                    className={cn(
                      "group flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-4 sm:px-5",
                      task.done && "bg-muted/15"
                    )}
                  >
                    {/* Checkbox */}
                    <div className="flex items-start sm:items-center">
                      <Checkbox
                        checked={task.done}
                        onChange={() => handleToggle(task)}
                        aria-label={task.done ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
                      />
                    </div>

                    {/* Task Title and Description */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "m-0 text-sm font-semibold text-foreground transition-colors",
                          task.done && "text-muted-foreground line-through"
                        )}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Meta Tags: Type, Due Date, Assignee */}
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      {/* Task Type Badge */}
                      <Badge variant="outline" className="gap-1.5 font-medium text-xs">
                        <TypeIcon className="size-3 text-muted-foreground" />
                        {typeInfo.label}
                      </Badge>

                      {/* Due Urgency Badge */}
                      <span
                        className={cn(
                          "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold tabular-nums",
                          dueInfo.tone === "destructive" && "bg-destructive-muted text-destructive",
                          dueInfo.tone === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                          dueInfo.tone === "info" && "bg-primary/10 text-primary border border-primary/20",
                          dueInfo.tone === "neutral" && "bg-muted text-muted-foreground",
                          dueInfo.tone === "muted" && "bg-muted/60 text-muted-foreground line-through opacity-70"
                        )}
                      >
                        {dueInfo.label}
                      </span>

                      {/* Assignee indicator */}
                      {task.owner && (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
                          title={task.owner.email ?? undefined}
                        >
                          <UserIcon className="size-3 text-muted-foreground/80" />
                          <span className="max-w-[120px] truncate">
                            {task.owner.id === currentUserId ? "You" : (task.owner.name || "Assigned")}
                          </span>
                        </span>
                      )}

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 rounded-full">
                            <MoreHorizontalIcon className="size-4" />
                            <span className="sr-only">Task actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setTaskToEdit(task);
                              setFormOpen(true);
                            }}
                          >
                            <PencilIcon className="mr-2 size-4" />
                            Edit task
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTask(task)}
                          >
                            <Trash2Icon className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PageContent>

      {/* Dialogs */}
      <TaskFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        taskToEdit={taskToEdit}
      />

      <TaskDeleteDialog
        open={Boolean(deleteTask)}
        task={deleteTask}
        onClose={() => setDeleteTask(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}
