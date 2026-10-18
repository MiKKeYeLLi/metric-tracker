import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { dateFromInput, serializeContent } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { z } from "@/lib/zod";
import { contentUpdateSchema } from "@/lib/schemas/content";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.contentItem.findFirst({ where: { id: params.id, userId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeContent(item));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Validation failed", details: { _errors: ["Invalid JSON"] } }, { status: 400 });
  }

  const result = contentUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.contentItem.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = result.data;
  const updated = await prisma.contentItem.update({
    where: { id: existing.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.url !== undefined && { url: data.url }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.topics !== undefined && { topics: data.topics }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.createdDate !== undefined && { createdDate: dateFromInput(data.createdDate) }),
      ...(data.publishDate !== undefined && {
        publishDate: data.publishDate ? dateFromInput(data.publishDate) : null,
      }),
      ...(data.updatedDate !== undefined && {
        updatedDate: data.updatedDate ? dateFromInput(data.updatedDate) : null,
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  return NextResponse.json(serializeContent(updated));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.contentItem.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.contentItem.delete({ where: { id: existing.id } });
  return new NextResponse(null, { status: 204 });
}