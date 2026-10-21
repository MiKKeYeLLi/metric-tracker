import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { ideaInclude, toIdeaItem } from "@/lib/ideas";
import { ideaItemSchema } from "@/lib/schemas/ideas";
import type { z } from "@/lib/zod";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // Only humans decide ideas; rejected ideas stay visible as rejected.
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = params;

  const idea = await prisma.workstream.findUnique({ where: { id } });
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  if (idea.status === "rejected") {
    return NextResponse.json({ error: "Idea has already been rejected" }, { status: 400 });
  }
  if (idea.status === "accepted") {
    return NextResponse.json({ error: "Idea has already been accepted and cannot be rejected" }, { status: 400 });
  }

  const userId = (session.user as { id?: string }).id;
  // The WHERE clause re-tests the status, so a concurrent accept/reject cannot be overwritten.
  const result = await prisma.workstream.updateMany({
    where: { id, status: "proposed" },
    data: { status: "rejected", acceptedById: userId },
  });

  if (result.count === 0) {
    const current = await prisma.workstream.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    if (current.status === "rejected") {
      return NextResponse.json({ error: "Idea has already been rejected" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Idea has already been accepted and cannot be rejected" },
      { status: 409 }
    );
  }

  const rejected = await prisma.workstream.findUnique({
    where: { id },
    include: ideaInclude,
  });
  if (!rejected) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const body = toIdeaItem(rejected) satisfies z.infer<typeof ideaItemSchema>;
  return NextResponse.json(body);
}
