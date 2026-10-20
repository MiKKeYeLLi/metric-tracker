import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { commentCreateSchema } from "@/lib/schemas/comments";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check auth: either Agent key or Human session
  const apiKeyHeader = request.headers.get("x-agent-key");
  const authHeader = request.headers.get("authorization");
  let hasValidAgent = false;

  let apiKey: string | null = null;
  if (apiKeyHeader) {
    apiKey = apiKeyHeader.trim();
  } else if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    apiKey = authHeader.slice(7).trim();
  }

  if (apiKey) {
    const agent = await prisma.agent.findUnique({ where: { apiKey } });
    if (!agent) {
      return NextResponse.json({ error: "Invalid agent key" }, { status: 401 });
    }
    hasValidAgent = true;
  }

  if (!hasValidAgent) {
    const { error } = await requireAuth();
    if (error) return error;
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const comments = await prisma.taskComment.findMany({
    where: { taskId: params.id },
    include: {
      authorAgent: { select: { id: true, name: true, speciality: true } },
      authorUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const serialized = comments.map((comment) => ({
    id: comment.id,
    taskId: comment.taskId,
    type: comment.type,
    tag: comment.tag,
    title: comment.title,
    body: comment.body,
    attachment: comment.attachment,
    score: comment.score,
    authorAgentId: comment.authorAgentId,
    authorAgent: comment.authorAgent,
    authorUserId: comment.authorUserId,
    authorUser: comment.authorUser,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }));

  return NextResponse.json(serialized);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Determine caller identity: Agent or Human User
  const apiKeyHeader = request.headers.get("x-agent-key");
  const authHeader = request.headers.get("authorization");
  let apiKey: string | null = null;

  if (apiKeyHeader) {
    apiKey = apiKeyHeader.trim();
  } else if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    apiKey = authHeader.slice(7).trim();
  }

  let callerAgent: { id: string; name: string; speciality: string } | null = null;
  let callerUserId: string | null = null;

  if (apiKey) {
    const agent = await prisma.agent.findUnique({
      where: { apiKey },
      select: { id: true, name: true, speciality: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Invalid agent key" }, { status: 401 });
    }
    // Update agent's activity timestamp
    await prisma.agent.update({
      where: { id: agent.id },
      data: { lastActiveAt: new Date() },
    });
    callerAgent = agent;
  } else {
    const { session, error } = await requireAuth();
    if (error) return error;

    callerUserId = (session.user as { id?: string }).id ?? null;
    if (!callerUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Verify task exists
  const task = await prisma.task.findUnique({
    where: { id: params.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Parse and validate payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Validation failed", details: { _errors: ["Invalid JSON"] } },
      { status: 400 }
    );
  }

  const result = commentCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { type, tag, title, body: commentBody, attachment, score } = result.data;

  // Task 4.1 State Side-Effects & Rules:
  // 1. Deliveries: only allowed by assigned worker agent, must include attachment
  if (type === "delivery") {
    if (!callerAgent || task.assignedAgentId !== callerAgent.id) {
      return NextResponse.json(
        { error: "Only the assigned worker agent can submit deliverables" },
        { status: 403 }
      );
    }

    if (!attachment || attachment.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: { attachment: ["Deliverables must include an attachment"] },
        },
        { status: 400 }
      );
    }

    // Move task status to submitted
    await prisma.task.update({
      where: { id: params.id },
      data: { status: "submitted" },
    });
  }

  // 2. Bid: moves task status from open to bidding
  if (type === "bid") {
    if (task.status === "open") {
      await prisma.task.update({
        where: { id: params.id },
        data: { status: "bidding" },
      });
    }
  }

  // Save the comment
  const comment = await prisma.taskComment.create({
    data: {
      taskId: params.id,
      type,
      tag: tag ?? null,
      title: title ?? null,
      body: commentBody,
      attachment: attachment ?? null,
      score: score ?? null,
      authorAgentId: callerAgent ? callerAgent.id : null,
      authorUserId: callerUserId ? callerUserId : null,
    },
    include: {
      authorAgent: { select: { id: true, name: true, speciality: true } },
      authorUser: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(
    {
      id: comment.id,
      taskId: comment.taskId,
      type: comment.type,
      tag: comment.tag,
      title: comment.title,
      body: comment.body,
      attachment: comment.attachment,
      score: comment.score,
      authorAgentId: comment.authorAgentId,
      authorAgent: comment.authorAgent,
      authorUserId: comment.authorUserId,
      authorUser: comment.authorUser,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}
