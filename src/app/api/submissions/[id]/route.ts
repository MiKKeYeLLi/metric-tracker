import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { SubmissionStatus } from "@prisma/client";

const VALID_STATUSES = new Set<string>(["planned", "submitted", "live", "rejected"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const data: { status?: SubmissionStatus; listingUrl?: string | null; submittedAt?: Date | null } = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
    if (body.status === "submitted" && !body.submittedAt) {
      data.submittedAt = new Date();
    }
  }

  if (body.listingUrl !== undefined) data.listingUrl = body.listingUrl;
  if (body.submittedAt !== undefined) data.submittedAt = body.submittedAt ? new Date(body.submittedAt) : null;

  const submission = await prisma.submission.update({
    where: { id: params.id },
    data,
    include: {
      product: { select: { id: true, name: true } },
      directory: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(submission);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAuth();
  if (error) return error;

  await prisma.submission.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
