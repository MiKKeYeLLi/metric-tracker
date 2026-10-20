import type { Agent } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";

/**
 * Interim agent-key authentication.
 *
 * TODO(agent-auth): task 1.2 (`getAuthContext`) will unify human sessions and
 * agent keys behind one helper — replace these functions when it lands.
 * Until then, agent-facing endpoints authenticate with the agent's key from the
 * dashboard, sent as `X-Agent-Key: <apiKey>` (an `Authorization: Bearer <apiKey>`
 * header is also accepted). The agent's `lastActiveAt` is refreshed on every
 * authenticated call.
 */
export async function requireAgentAuth(
  request: Request
): Promise<{ agent: Agent; error: null } | { agent: null; error: NextResponse }> {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const key = request.headers.get("x-agent-key")?.trim() || bearer || "";

  if (!key) {
    return {
      agent: null,
      error: NextResponse.json(
        { error: "Unauthorized: missing agent key (send X-Agent-Key)" },
        { status: 401 }
      ),
    };
  }

  const agent = await prisma.agent.findUnique({ where: { apiKey: key } });
  if (!agent) {
    return {
      agent: null,
      error: NextResponse.json({ error: "Unauthorized: unknown agent key" }, { status: 401 }),
    };
  }

  await prisma.agent.update({ where: { id: agent.id }, data: { lastActiveAt: new Date() } });

  return { agent, error: null };
}
