"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  DEMO_AGENTS,
  MAX_REVISIONS,
  demoGoals,
  demoIdeas,
  demoTasks,
  type Agent,
  type DemoUser,
  type Goal,
  type Idea,
  type Task,
} from "./goal-model";
import {
  currentRoundReviews,
  demoThread,
  tagForTask,
  threadStats,
  type CommentType,
  type ThreadEntry,
} from "./thread-model";

export type NewGoal = { title: string; type: string; description: string };

type GoalsContextValue = {
  currentUser: DemoUser;
  goals: Goal[];
  ideas: Idea[];
  tasks: Task[];
  agentFor: (agentId: string) => Agent | undefined;
  createGoal: (input: NewGoal) => void;
  approveIdea: (ideaId: string) => void;
  rejectIdea: (ideaId: string, reason: string) => void;
  threadFor: (taskId: string) => ThreadEntry[];
  approveTask: (taskId: string, note: string) => void;
  requestChanges: (taskId: string, feedback: string) => void;
  addNote: (taskId: string, body: string) => void;
};

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

const EMPTY_THREAD: ThreadEntry[] = [];

/** Demo-only store for the Goals section. State lives in the browser until the backend is connected. */
export function GoalsProvider({ currentUser, children }: { currentUser: DemoUser; children: React.ReactNode }) {
  const [goals, setGoals] = useState(() => demoGoals(currentUser));
  const [ideas, setIdeas] = useState(() => demoIdeas(currentUser));
  const [baseTasks, setBaseTasks] = useState(demoTasks);
  const [threads, setThreads] = useState<Record<string, ThreadEntry[]>>(() =>
    Object.fromEntries(baseTasks.map((task) => [task.id, demoThread(task)]))
  );

  /** Counts shown on task rows come from the thread, so the two never disagree. */
  const tasks = useMemo(
    () =>
      baseTasks.map((task) => {
        const thread = threads[task.id] ?? EMPTY_THREAD;
        const stats = threadStats(thread);
        return {
          ...task,
          bidCount: stats.bids,
          commentCount: stats.comments,
          reviewCount: currentRoundReviews(thread).length,
        };
      }),
    [baseTasks, threads]
  );

  const createGoal = useCallback(
    (input: NewGoal) =>
      setGoals((previous) => [
        {
          ...input,
          id: `goal_${Date.now()}`,
          ownerId: currentUser.id,
          ownerName: currentUser.name,
          createdAt: new Date().toISOString(),
        },
        ...previous,
      ]),
    [currentUser]
  );

  const decide = useCallback(
    (ideaId: string, change: Pick<Idea, "status"> & Partial<Idea>) =>
      setIdeas((previous) =>
        previous.map((idea) =>
          idea.id === ideaId
            ? { ...idea, ...change, decidedBy: currentUser.name, decidedAt: new Date().toISOString() }
            : idea
        )
      ),
    [currentUser]
  );

  const append = useCallback((taskId: string, entries: ThreadEntry[]) => {
    setThreads((previous) => ({ ...previous, [taskId]: [...(previous[taskId] ?? []), ...entries] }));
  }, []);

  const updateTask = useCallback((taskId: string, change: Partial<Task>) => {
    setBaseTasks((previous) =>
      previous.map((task) => (task.id === taskId ? { ...task, ...change, updatedAt: new Date().toISOString() } : task))
    );
  }, []);

  const humanComment = useCallback(
    (task: Task, type: CommentType, title: string, body: string): ThreadEntry => ({
      kind: "comment",
      id: `${task.id}_${Date.now()}_${type}`,
      taskId: task.id,
      type,
      tag: tagForTask(task),
      title,
      body,
      author: { kind: "human", name: currentUser.name },
      at: new Date().toISOString(),
    }),
    [currentUser]
  );

  const systemEvent = (taskId: string, text: string): ThreadEntry => ({
    kind: "event",
    id: `${taskId}_${Date.now()}_event`,
    taskId,
    text,
    at: new Date().toISOString(),
  });

  const approveTask = useCallback(
    (taskId: string, note: string) => {
      const task = baseTasks.find((candidate) => candidate.id === taskId);
      if (!task) return;
      const owner = DEMO_AGENTS.find((agent) => agent.id === task.assignedAgentId)?.ownerName ?? "the worker's owner";
      append(taskId, [
        humanComment(task, "approval", "Approved", note || `Meets the brief. Releasing ${task.points} points to ${owner}.`),
        systemEvent(taskId, `${task.points} pts released to ${owner}`),
      ]);
      updateTask(taskId, { status: "approved" });
    },
    [baseTasks, append, humanComment, updateTask]
  );

  const requestChanges = useCallback(
    (taskId: string, feedback: string) => {
      const task = baseTasks.find((candidate) => candidate.id === taskId);
      if (!task) return;
      const worker = DEMO_AGENTS.find((agent) => agent.id === task.assignedAgentId)?.name ?? "The worker";

      if (task.revisionCount >= MAX_REVISIONS) {
        append(taskId, [
          humanComment(task, "revision_request", "Revision limit reached", feedback),
          systemEvent(taskId, `${worker} was unassigned after ${MAX_REVISIONS} revisions. The task is open for bids again`),
        ]);
        updateTask(taskId, { status: "bidding", assignedAgentId: undefined, revisionCount: 0 });
        return;
      }

      const round = task.revisionCount + 1;
      append(taskId, [humanComment(task, "revision_request", `Revision ${round} of ${MAX_REVISIONS}`, feedback)]);
      updateTask(taskId, { status: "changes_requested", revisionCount: round });
    },
    [baseTasks, append, humanComment, updateTask]
  );

  const addNote = useCallback(
    (taskId: string, body: string) => {
      const task = baseTasks.find((candidate) => candidate.id === taskId);
      if (task) append(taskId, [humanComment(task, "note", "Note", body)]);
    },
    [baseTasks, append, humanComment]
  );

  const value = useMemo<GoalsContextValue>(
    () => ({
      currentUser,
      goals,
      ideas,
      tasks,
      agentFor: (agentId) => DEMO_AGENTS.find((agent) => agent.id === agentId),
      createGoal,
      approveIdea: (ideaId) => decide(ideaId, { status: "accepted" }),
      rejectIdea: (ideaId, reason) => decide(ideaId, { status: "rejected", rejectionReason: reason || undefined }),
      threadFor: (taskId) => threads[taskId] ?? EMPTY_THREAD,
      approveTask,
      requestChanges,
      addNote,
    }),
    [currentUser, goals, ideas, tasks, threads, createGoal, decide, approveTask, requestChanges, addNote]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error("useGoals must be used inside GoalsProvider");
  return context;
}
