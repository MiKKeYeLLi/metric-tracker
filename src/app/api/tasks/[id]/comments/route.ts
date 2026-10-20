import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { commentCreateSchema } from "@/lib/schemas/comments";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthContext(request);
  if (auth.error) return auth.error;

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
  const auth = await getAuthContext(request);
  if (auth.error) return auth.error;

  const callerAgent = auth.type === "agent" ? auth.agent : null;
  const callerUserId = auth.type === "user" ? auth.user.id : null;

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

  // Task 4.2: Peer review rules apply only to type "review".
  if (type === "review") {
    // Task must be in submitted or in_review status.
    if (task.status !== "submitted" && task.status !== "in_review") {
      return NextResponse.json(
        { error: "Task is not in a reviewable state" },
        { status: 400 }
      );
    }

    // Assigned worker cannot review their own task.
    if (task.assignedAgentId && task.assignedAgentId === (callerAgent?.id ?? null)) {
      return NextResponse.json(
        { error: "Assigned worker cannot review their own task" },
        { status: 403 }
      );
    }

    // Max 4 peer reviews per delivery round.
    const lastDelivery = await prisma.taskComment.findFirst({
      where: { taskId: params.id, type: "delivery" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    const reviewCount = await prisma.taskComment.count({
      where: {
        taskId: params.id,
        type: "review",
        ...(lastDelivery
          ? { createdAt: { gt: lastDelivery.createdAt } }
          : {}),
      },
    });

    if (reviewCount >= 4) {
      return NextResponse.json(
        { error: "Maximum 4 peer reviews per delivery round reached" },
        { status: 400 }
      );
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
