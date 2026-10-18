import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { normalizeCoverage, normalizeSubmission, resolveOutletId } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { mediaFeatureSchema } from "@/lib/schemas/media";

export const dynamic = "force-dynamic";

/** Turns a pitch into published coverage in one transaction: creates the coverage and links the pitch to it. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Validation failed", details: { _errors: ["Invalid JSON"] } }, { status: 400 });
  }

  const parsed = mediaFeatureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const pitch = await prisma.pressSubmission.findUnique({ where: { id: params.id } });
  if (!pitch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pitch.coverageId) {
    return NextResponse.json(
      { error: "Validation failed", details: { id: ["This pitch is already marked as featured."] } },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const title = input.title || pitch.title;
  const articleUrl = input.articleUrl || null;

  const result = await prisma.$transaction(async (tx) => {
    const coverage = await tx.pressCoverage.create({
      data: {
        title,
        outlet: pitch.outlet,
        outletId: pitch.outletId ?? (await resolveOutletId(tx, pitch.outlet)),
        articleType: pitch.articleType,
        articleTypeOther: pitch.articleTypeOther,
        publishedArticleUrl: articleUrl,
        publicationDate: input.publicationDate ? new Date(input.publicationDate) : new Date(),
      },
    });
    const submission = await tx.pressSubmission.update({
      where: { id: pitch.id },
      data: { status: "Published", title, publishedArticleUrl: articleUrl, coverageId: coverage.id },
    });
    return { coverage, submission };
  });

  return NextResponse.json(
    { coverage: normalizeCoverage(result.coverage), submission: normalizeSubmission(result.submission) },
    { status: 201 }
  );
}
