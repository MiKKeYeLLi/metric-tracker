import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

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

  const { name, url } = await req.json();
  if (!name || !url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 });
  }

  const directory = await prisma.directory.create({ data: { name, url } });
  return NextResponse.json(directory, { status: 201 });
}
