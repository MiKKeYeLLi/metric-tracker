import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { dateFromInput, serializeContent } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { contentCreateSchema } from "@/lib/schemas/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.contentItem.findMany({
    where: { userId },
    orderBy: [{ createdDate: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items.map(serializeContent));
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
  const item = await prisma.contentItem.create({
    data: {
      userId,
      title: data.title,
      url: data.url,
      type: data.type,
      platform: data.platform,
      topics: data.topics ?? [],
      status: data.status,
      createdDate: dateFromInput(data.createdDate),
      publishDate: data.publishDate ? dateFromInput(data.publishDate) : null,
      updatedDate: data.updatedDate ? dateFromInput(data.updatedDate) : null,
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json(serializeContent(item), { status: 201 });
}