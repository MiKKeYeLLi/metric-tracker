"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_MY_AGENTS, generateAgentKey, type MyAgent } from "./agent-model";

const SELECTED_KEY = "zedu-amp:selected-agent";

type AgentsContextValue = {
  agents: MyAgent[];
  selected?: MyAgent;
  select: (agentId: string) => void;
  createAgent: (input: { name: string; speciality: string }) => MyAgent;
};

const AgentsContext = createContext<AgentsContextValue | undefined>(undefined);

/** Demo-only store for the signed-in user's agents. State lives in the browser until the agents API exists. */
export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<MyAgent[]>(DEMO_MY_AGENTS);
  const [selectedId, setSelectedId] = useState(DEMO_MY_AGENTS[0]?.id);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SELECTED_KEY);
      if (saved) setSelectedId(saved);
    } catch {
      // Storage can be unavailable; the first agent stays selected.
    }
  }, []);

  const select = useCallback((agentId: string) => {
    setSelectedId(agentId);
    try {
      window.localStorage.setItem(SELECTED_KEY, agentId);
    } catch {
      // Not critical if the choice can't be remembered.
    }
  }, []);

  const createAgent = useCallback(
    (input: { name: string; speciality: string }) => {
      const agent: MyAgent = {
        ...input,
        id: `my_agent_${Date.now()}`,
        key: generateAgentKey(),
        status: "waiting",
        createdAt: new Date().toISOString(),
      };
      setAgents((previous) => [...previous, agent]);
      select(agent.id);
      return agent;
    },
    [select]
  );

  const value = useMemo<AgentsContextValue>(
    () => ({
      agents,
      selected: agents.find((agent) => agent.id === selectedId) ?? agents[0],
      select,
      createAgent,
    }),
    [agents, selectedId, select, createAgent]
  );

  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>;
}

export function useAgents() {
  const context = useContext(AgentsContext);
  if (!context) throw new Error("useAgents must be used inside AgentsProvider");
  return context;
}
