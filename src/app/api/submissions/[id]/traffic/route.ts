import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { TrafficBodySchema } from "@/lib/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAuth();
  if (error) return error;

  const result = TrafficBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { date, visits } = result.data;

  const traffic = await prisma.traffic.create({
    data: { submissionId: params.id, date: new Date(date), visits },
  });

  return NextResponse.json(traffic, { status: 201 });
}
