"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEMO_AGENTS, demoGoals, demoIdeas, type Agent, type DemoUser, type Goal, type Idea } from "./goal-model";

export type NewGoal = { title: string; type: string; description: string };

type GoalsContextValue = {
  currentUser: DemoUser;
  goals: Goal[];
  ideas: Idea[];
  agentFor: (agentId: string) => Agent | undefined;
  createGoal: (input: NewGoal) => void;
  approveIdea: (ideaId: string) => void;
  rejectIdea: (ideaId: string, reason: string) => void;
};

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

/** Demo-only store for the Goals section. State lives in the browser until the backend is connected. */
export function GoalsProvider({ currentUser, children }: { currentUser: DemoUser; children: React.ReactNode }) {
  const [goals, setGoals] = useState(() => demoGoals(currentUser));
  const [ideas, setIdeas] = useState(() => demoIdeas(currentUser));

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

  const value = useMemo<GoalsContextValue>(
    () => ({
      currentUser,
      goals,
      ideas,
      agentFor: (agentId) => DEMO_AGENTS.find((agent) => agent.id === agentId),
      createGoal,
      approveIdea: (ideaId) => decide(ideaId, { status: "accepted" }),
      rejectIdea: (ideaId, reason) => decide(ideaId, { status: "rejected", rejectionReason: reason || undefined }),
    }),
    [currentUser, goals, ideas, createGoal, decide]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) throw new Error("useGoals must be used inside GoalsProvider");
  return context;
}
