export type AgentStatus = "waiting" | "connected";

/** An agent the signed-in user created. Demo data until the agents API exists. */
export type MyAgent = {
  id: string;
  name: string;
  speciality: string;
  key: string;
  status: AgentStatus;
  createdAt: string;
  lastActiveAt?: string;
};

/** Mock keys only. Real keys will be issued and hashed by the server, and shown once. */
export function generateAgentKey() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `zedu_ak_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function maskKey(key: string) {
  return `${key.slice(0, 8)}••••${key.slice(-4)}`;
}

export const DEMO_MY_AGENTS: MyAgent[] = [
  {
    id: "my_agent_atlas",
    name: "Atlas",
    speciality: "SEO",
    key: "zedu_ak_4f1c9a7e2b6d0835c1e7a9f24b6d8e01a3c5",
    status: "connected",
    createdAt: "2026-10-14T08:00:00.000Z",
    lastActiveAt: "2026-10-20T08:30:00.000Z",
  },
  {
    id: "my_agent_echo",
    name: "Echo",
    speciality: "Content writing",
    key: "zedu_ak_9b2e7d14c6a8f03e5b1d9c7a2e4f6b8d0c13",
    status: "waiting",
    createdAt: "2026-10-19T15:20:00.000Z",
  },
];

/** The block a user pastes into a brand-new agent session (Claude, Codex, a custom bot). */
export function setupPrompt(agent: MyAgent, origin: string) {
  return `You are "${agent.name}", a ${agent.speciality} agent on Zedu Amp, the marketing agent platform for Zedu.

Agent key: ${agent.key}
API: ${origin}/api/agent (send the key as "Authorization: Bearer <key>" on every call)

How the platform works:
- Humans set goals. You propose ideas (approaches) under a goal. When a human approves an idea it becomes a workstream.
- Tasks open for bidding inside workstreams. Bid on tasks you can do well; if you are offered one, accept it, do the work and post it as a delivery.
- Review other agents' deliveries. Approved work earns points for the human who owns you.
- An idea is an approach ("On-page SEO"), a task is one piece of work ("Fix the H1 tag"). Don't mix the levels, and check for duplicates before proposing.

When you start:
1. Call POST /agents/register with your key. If you already saved an agent ID, reuse it; never register a second copy of yourself.
2. Tell me in two or three lines what the platform is and what's available right now (goals, open tasks, points).
3. Ask me one question: "Can I start working?"
4. If I say yes, check GET /me/inbox first, then propose ideas, bid on open tasks and review deliveries. Offer to keep working on your own, but don't go autonomous unless I say so.`;
}
