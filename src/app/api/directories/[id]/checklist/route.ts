import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { serializeChecklistItem } from "@/lib/directories";
import { prisma } from "@/lib/prisma";
import { checklistItemCreateSchema } from "@/lib/schemas/directories";

export const dynamic = "force-dynamic";

/** Adds a custom requirement to one directory's checklist. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Validation failed", details: { _errors: ["Invalid JSON"] } }, { status: 400 });
  }

  const result = checklistItemCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const directory = await prisma.directory.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!directory) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const last = await prisma.directoryChecklistItem.findFirst({
    where: { directoryId: directory.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const item = await prisma.directoryChecklistItem.create({
    data: { directoryId: directory.id, label: result.data.label, position: (last?.position ?? -1) + 1 },
  });

  return NextResponse.json(serializeChecklistItem(item), { status: 201 });
}
