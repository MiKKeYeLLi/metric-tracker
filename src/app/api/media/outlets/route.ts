import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { serializeOutlet } from "@/lib/media";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const outlets = await prisma.pressOutlet.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(outlets.map(serializeOutlet));
}
