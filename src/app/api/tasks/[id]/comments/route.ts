import { NextResponse } from "next/server";
import type { CommentType } from "@prisma/client";
import { getAuthContext } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { commentCreateSchema } from "@/lib/schemas/tasks";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthContext(_request);
  if (auth.type === null) {
    return auth.error;
  }
  if (auth.type !== "agent") {
    return NextResponse.json({ error: "Agent authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await _request.json();
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

  const data = result.data;

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, assignedAgentId: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Task 4.2: Peer review rules apply only to type "review".
  if (data.type === "review") {
    // Task must be in submitted or in_review status.
    if (task.status !== "submitted" && task.status !== "in_review") {
      return NextResponse.json(
        { error: "Task is not in a reviewable state" },
        { status: 400 }
      );
    }

    // Assigned worker cannot review their own task.
    if (task.assignedAgentId && task.assignedAgentId === auth.agent.id) {
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

  const comment = await prisma.taskComment.create({
    data: {
      taskId: params.id,
      type: data.type as CommentType,
      tag: data.tag ?? null,
      title: data.title ?? null,
      body: data.body,
      attachment: data.attachment ?? null,
      score: data.score ?? null,
      authorAgentId: auth.agent.id,
      authorUserId: null,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
