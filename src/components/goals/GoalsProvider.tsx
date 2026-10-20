"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  DEMO_AGENTS,
  OFFER_HOURS,
  demoBids,
  demoGoals,
  demoIdeas,
  demoTasks,
  type Agent,
  type Bid,
  type DemoUser,
  type Goal,
  type Idea,
  type Task,
} from "./goal-model";

export type NewGoal = { title: string; type: string; description: string };

type GoalsContextValue = {
  currentUser: DemoUser;
  goals: Goal[];
  ideas: Idea[];
  tasks: Task[];
  bidsFor: (taskId: string) => Bid[];
  agentFor: (agentId: string) => Agent | undefined;
  createGoal: (input: NewGoal) => Goal;
  approveIdea: (ideaId: string) => void;
  rejectIdea: (ideaId: string, reason: string) => void;
  sendOffer: (taskId: string, agentId: string) => void;
  withdrawOffer: (taskId: string) => void;
  /** Demo stand-ins for what an agent does through the API. */
  acceptOffer: (taskId: string) => void;
  expireOffer: (taskId: string) => void;
};

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

/** Demo-only store for the Goals section, mounted by the dashboard layout so the top bar can create goals. */
export function GoalsProvider({ currentUser, children }: { currentUser: DemoUser; children: React.ReactNode }) {
  const [goals, setGoals] = useState(() => demoGoals(currentUser));
  const [ideas, setIdeas] = useState(() => demoIdeas(currentUser));
  const [tasks, setTasks] = useState(demoTasks);
  const [bids] = useState(demoBids);

  const createGoal = useCallback(
    (input: NewGoal) => {
      const goal: Goal = {
        ...input,
        id: `goal_${Date.now()}`,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      setGoals((previous) => [goal, ...previous]);
      return goal;
    },
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

  const updateTask = useCallback(
    (taskId: string, update: (task: Task) => Task) =>
      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId ? { ...update(task), updatedAt: new Date().toISOString() } : task
        )
      ),
    []
  );

  const value = useMemo<GoalsContextValue>(
    () => ({
      currentUser,
      goals,
      ideas,
      tasks,
      bidsFor: (taskId) => bids.filter((bid) => bid.taskId === taskId),
      agentFor: (agentId) => DEMO_AGENTS.find((agent) => agent.id === agentId),
      createGoal,
      approveIdea: (ideaId) => decide(ideaId, { status: "accepted" }),
      rejectIdea: (ideaId, reason) => decide(ideaId, { status: "rejected", rejectionReason: reason || undefined }),
      sendOffer: (taskId, agentId) =>
        updateTask(taskId, (task) => {
          const sentAt = new Date();
          const expiresAt = new Date(sentAt.getTime() + OFFER_HOURS * 60 * 60 * 1000);
          return { ...task, offer: { agentId, sentAt: sentAt.toISOString(), expiresAt: expiresAt.toISOString() } };
        }),
      withdrawOffer: (taskId) => updateTask(taskId, (task) => ({ ...task, offer: undefined })),
      acceptOffer: (taskId) =>
        updateTask(taskId, (task) =>
          task.offer
            ? { ...task, status: "in_progress", assignedAgentId: task.offer.agentId, offer: undefined }
            : task
        ),
      expireOffer: (taskId) => updateTask(taskId, (task) => ({ ...task, offer: undefined })),
    }),
    [currentUser, goals, ideas, tasks, bids, createGoal, decide, updateTask]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error("useGoals must be used inside GoalsProvider");
  return context;
}
