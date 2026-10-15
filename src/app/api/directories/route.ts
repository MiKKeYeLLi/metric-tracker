import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { DirectoryBodySchema } from "@/lib/schemas";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const directories = await prisma.directory.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { submissions: true } } },
  });

  return NextResponse.json(directories);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const result = DirectoryBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const directory = await prisma.directory.create({ data: result.data });
  return NextResponse.json(directory, { status: 201 });
}
