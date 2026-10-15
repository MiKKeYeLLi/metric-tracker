import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { date, visits } = await req.json();
  if (!date || visits === undefined) {
    return NextResponse.json({ error: "date and visits are required" }, { status: 400 });
  }
  if (typeof visits !== "number" || visits < 0) {
    return NextResponse.json({ error: "visits must be a non-negative number" }, { status: 400 });
  }

  const traffic = await prisma.traffic.create({
    data: {
      submissionId: params.id,
      date: new Date(date),
      visits,
    },
  });

  return NextResponse.json(traffic, { status: 201 });
}
