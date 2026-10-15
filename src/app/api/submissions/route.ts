import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

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

  const { productId, directoryId, status, submittedAt, listingUrl } = await req.json();
  if (!productId || !directoryId) {
    return NextResponse.json({ error: "productId and directoryId are required" }, { status: 400 });
  }

  const submission = await prisma.submission.create({
    data: {
      productId,
      directoryId,
      status: status ?? "planned",
      submittedAt: submittedAt ? new Date(submittedAt) : null,
      listingUrl: listingUrl ?? null,
    },
    include: {
      product: { select: { id: true, name: true } },
      directory: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
