import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import {
  dateFromInput,
  isSubmittedStatus,
  serializeDirectory,
  statusMessage,
  statusToDb,
  todayDate,
  withChecklist,
} from "@/lib/directories";
import { prisma } from "@/lib/prisma";
import { directoryUpdateSchema } from "@/lib/schemas/directories";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const directory = await prisma.directory.findUnique({ where: { id: params.id }, include: withChecklist });
  if (!directory) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeDirectory(directory));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Validation failed", details: { _errors: ["Invalid JSON"] } }, { status: 400 });
  }

  const result = directoryUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.directory.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = result.data;
  const nextStatus = data.status !== undefined ? statusToDb(data.status) : existing.status;
  const statusChanged = nextStatus !== existing.status;
  const listingAdded = Boolean(data.listingUrl) && !existing.listingUrl;

  const directory = await prisma.$transaction(async (tx) => {
    const updated = await tx.directory.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.listingUrl !== undefined && { listingUrl: data.listingUrl || null }),
        ...(statusChanged && { status: nextStatus }),
        ...(data.dateSubmitted !== undefined
          ? { dateSubmitted: data.dateSubmitted ? dateFromInput(data.dateSubmitted) : null }
          : statusChanged && isSubmittedStatus(nextStatus) && !existing.dateSubmitted
            ? { dateSubmitted: todayDate() }
            : {}),
      },
      include: withChecklist,
    });
    if (statusChanged) {
      await tx.directoryActivity.create({
        data: {
          directoryId: updated.id,
          directoryName: updated.name,
          message: statusMessage(updated.name, nextStatus),
          status: nextStatus,
        },
      });
    } else if (listingAdded) {
      await tx.directoryActivity.create({
        data: {
          directoryId: updated.id,
          directoryName: updated.name,
          message: `${updated.name} listing link added`,
          status: updated.status,
        },
      });
    }
    return updated;
  });

  return NextResponse.json(serializeDirectory(directory));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const existing = await prisma.directory.findUnique({ where: { id: params.id }, select: { id: true, name: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.directory.delete({ where: { id: existing.id } }),
    prisma.directoryActivity.create({
      data: { directoryName: existing.name, message: `${existing.name} removed from the list` },
    }),
  ]);

  return new NextResponse(null, { status: 204 });
}
