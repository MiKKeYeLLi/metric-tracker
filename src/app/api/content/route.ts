import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/api";
import { dateFromInput, serializeContent } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { contentCreateSchema } from "@/lib/schemas/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;
  const items = await prisma.contentItem.findMany({
    orderBy: [{ createdDate: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items.map((item) => serializeContent(item as typeof item & { views: number })));
}

export async function POST(request: Request) {
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

  const result = contentCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = result.data;
  const contentData = {
    userId,
    title: data.title,
    url: data.url,
    type: data.type,
    platform: data.platform,
    topics: data.topics ?? [],
    status: data.status,
    createdDate: dateFromInput(data.createdDate ?? new Date().toISOString().slice(0, 10)),
    publishDate: data.publishDate ? dateFromInput(data.publishDate) : null,
    updatedDate: data.updatedDate ? dateFromInput(data.updatedDate) : null,
    views: data.views,
    notes: data.notes ?? null,
  };
  const item = await prisma.contentItem.create({ data: contentData as unknown as Prisma.ContentItemUncheckedCreateInput });

  return NextResponse.json(serializeContent(item as typeof item & { views: number }), { status: 201 });
}
