import { z } from "@/lib/zod";

export const articleTypeValues = [
  "News Article",
  "Interview",
  "Feature Story",
  "Press Release",
  "Opinion / Commentary",
  "Partner / Sponsored Content",
  "Broadcast / Podcast Appearance",
  "Other",
] as const;

export const submissionStatusValues = [
  "Draft",
  "Submitted",
  "Under Review",
  "Changes Requested",
  "Accepted",
  "Published",
  "Rejected",
  "Withdrawn",
] as const;

export const recordTypeValues = ["Press Coverage", "Press Submission"] as const;

export const articleTypeSchema = z.enum(articleTypeValues);
export const submissionStatusSchema = z.enum(submissionStatusValues);
export const recordTypeSchema = z.enum(recordTypeValues);

export const mediaRecordSchema = z.object({
  id: z.string(),
  recordType: recordTypeSchema,
  articleType: articleTypeSchema,
  articleTypeOther: z.string().optional(),
  title: z.string(),
  outlet: z.string(),
  publicationDate: z.string().optional(),
  dateSubmitted: z.string().optional(),
  status: z.string().optional(),
  responsiblePerson: z.string().optional(),
  followUpDate: z.string().optional(),
  articleUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  notes: z.string().optional(),
  linkedCoverageId: z.string().optional(),
});

export const mediaListResponseSchema = z.object({
  records: z.array(mediaRecordSchema),
});

export const mediaInputSchema = z.object({
  recordType: recordTypeSchema,
  articleType: articleTypeSchema,
  articleTypeOther: z.string().optional(),
  // A target outlet often has no story yet, so the title may be empty.
  title: z.string().trim().max(300).default(""),
  outlet: z.string().trim().min(1, "Media outlet is required."),
  publicationDate: z.string().optional().or(z.literal("")),
  dateSubmitted: z.string().optional().or(z.literal("")),
  status: submissionStatusSchema.optional(),
  responsiblePerson: z.string().optional(),
  followUpDate: z.string().optional().or(z.literal("")),
  articleUrl: z.string().optional().or(z.literal("")),
  documentUrl: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
  linkedCoverageId: z.string().optional(),
});
