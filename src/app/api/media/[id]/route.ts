import { $Enums } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { mediaInputSchema } from "@/lib/schemas/media";

export const dynamic = "force-dynamic";

const articleTypeMap: Record<string, $Enums.ArticleType> = {
  "News Article": "NewsArticle",
  "Interview": "Interview",
  "Feature Story": "FeatureStory",
  "Press Release": "PressRelease",
  "Opinion / Commentary": "OpinionCommentary",
  "Partner / Sponsored Content": "PartnerSponsoredContent",
  "Broadcast / Podcast Appearance": "BroadcastPodcastAppearance",
  "Other": "Other",
};

const submissionStatusMap: Record<string, $Enums.SubmissionStatus> = {
  Draft: "Draft",
  Submitted: "Submitted",
  "Under Review": "UnderReview",
  "Changes Requested": "ChangesRequested",
  Accepted: "Accepted",
  Published: "Published",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",
};

const articleTypeDisplay: Record<string, string> = {
  NewsArticle: "News Article",
  Interview: "Interview",
  FeatureStory: "Feature Story",
  PressRelease: "Press Release",
  OpinionCommentary: "Opinion / Commentary",
  PartnerSponsoredContent: "Partner / Sponsored Content",
  BroadcastPodcastAppearance: "Broadcast / Podcast Appearance",
  Other: "Other",
};

const submissionStatusDisplay: Record<string, string> = {
  Draft: "Draft",
  Submitted: "Submitted",
  UnderReview: "Under Review",
  ChangesRequested: "Changes Requested",
  Accepted: "Accepted",
  Published: "Published",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",
};

function formatDate(date: Date | null | undefined) {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

function normalizeCoverage(record: {
  id: string;
  title: string;
  outlet: string;
  articleType: string;
  articleTypeOther: string | null;
  publishedArticleUrl: string | null;
  publicationDate: Date | null;
  summary: string | null;
}) {
  return {
    id: record.id,
    recordType: "Press Coverage",
    articleType: articleTypeDisplay[record.articleType] ?? record.articleType,
    articleTypeOther: record.articleTypeOther ?? undefined,
    title: record.title,
    outlet: record.outlet,
    publicationDate: formatDate(record.publicationDate),
    articleUrl: record.publishedArticleUrl ?? undefined,
    notes: record.summary ?? undefined,
    status: "Published",
  };
}

function normalizeSubmission(record: {
  id: string;
  title: string;
  outlet: string;
  articleType: string;
  articleTypeOther: string | null;
  status: string;
  dateSubmitted: Date;
  responsiblePerson: string | null;
  followUpDate: Date | null;
  draftUrl: string | null;
  publishedArticleUrl: string | null;
  notes: string | null;
  coverageId: string | null;
}) {
  return {
    id: record.id,
    recordType: "Press Submission",
    articleType: articleTypeDisplay[record.articleType] ?? record.articleType,
    articleTypeOther: record.articleTypeOther ?? undefined,
    title: record.title,
    outlet: record.outlet,
    dateSubmitted: formatDate(record.dateSubmitted),
    status: submissionStatusDisplay[record.status] ?? record.status,
    responsiblePerson: record.responsiblePerson ?? undefined,
    followUpDate: formatDate(record.followUpDate),
    documentUrl: record.draftUrl ?? undefined,
    articleUrl: record.publishedArticleUrl ?? undefined,
    notes: record.notes ?? undefined,
    linkedCoverageId: record.coverageId ?? undefined,
  };
}

export async function PUT(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAuth();
  if (error) return error;

  const body = await _request.json();
  const parsed = mediaInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const articleType: $Enums.ArticleType = articleTypeMap[payload.articleType] ?? "Other";
  const existingSubmission = await prisma.pressSubmission.findUnique({ where: { id: params.id } });
  const existingCoverage = await prisma.pressCoverage.findUnique({ where: { id: params.id } });

  if (!existingSubmission && !existingCoverage) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (payload.recordType === "Press Coverage") {
    const updated = await prisma.pressCoverage.update({
      where: { id: params.id },
      data: {
        title: payload.title,
        outlet: payload.outlet,
        articleType,
        articleTypeOther: payload.articleType === "Other" ? payload.articleTypeOther || null : null,
        publishedArticleUrl: payload.articleUrl || null,
        publicationDate: payload.publicationDate ? new Date(payload.publicationDate) : null,
        summary: payload.notes || null,
      },
    });

    return NextResponse.json(normalizeCoverage(updated));
  }

  const updated = await prisma.pressSubmission.update({
    where: { id: params.id },
    data: {
      title: payload.title,
      outlet: payload.outlet,
      articleType,
      articleTypeOther: payload.articleType === "Other" ? payload.articleTypeOther || null : null,
      status: payload.status
        ? (submissionStatusMap[payload.status] ?? "Draft")
        : "Draft",
      dateSubmitted: payload.dateSubmitted ? new Date(payload.dateSubmitted) : new Date(),
      responsiblePerson: payload.responsiblePerson || null,
      followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
      draftUrl: payload.documentUrl || null,
      publishedArticleUrl: payload.articleUrl || null,
      notes: payload.notes || null,
      coverageId: payload.linkedCoverageId || null,
    },
  });

  return NextResponse.json(normalizeSubmission(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAuth();
  if (error) return error;

  const submission = await prisma.pressSubmission.findUnique({ where: { id: params.id } });
  const coverage = await prisma.pressCoverage.findUnique({ where: { id: params.id } });

  if (!submission && !coverage) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (submission) {
    await prisma.pressSubmission.delete({ where: { id: params.id } });
  }

  if (coverage) {
    await prisma.pressCoverage.delete({ where: { id: params.id } });
  }

  return new NextResponse(null, { status: 204 });
}
