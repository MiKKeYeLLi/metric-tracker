import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { name, url } = await req.json();
  if (!name || !url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 });
  }

  const product = await prisma.product.create({ data: { name, url } });
  return NextResponse.json(product, { status: 201 });
}
