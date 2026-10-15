import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { CreateSubmissionBodySchema } from "@/lib/schemas";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, url: true } },
      directory: { select: { id: true, name: true, url: true } },
      _count: { select: { traffic: true } },
    },
  });

  return NextResponse.json(submissions);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const result = CreateSubmissionBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { productId, directoryId, status, submittedAt, listingUrl } = result.data;

  const submission = await prisma.submission.create({
    data: {
      productId,
      directoryId,
      status: status ?? "planned",
      submittedAt: submittedAt ? new Date(submittedAt) : null,
      listingUrl: listingUrl ?? null,
    },
    include: {
      product: { select: { id: true, name: true, url: true } },
      directory: { select: { id: true, name: true, url: true } },
      _count: { select: { traffic: true } },
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
