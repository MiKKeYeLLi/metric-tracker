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
// An empty string means the article type isn't known yet (common for targets).
const optionalArticleTypeSchema = z.union([articleTypeSchema, z.literal("")]);
export const submissionStatusSchema = z.enum(submissionStatusValues);
export const recordTypeSchema = z.enum(recordTypeValues);

export const mediaRecordSchema = z.object({
  id: z.string(),
  recordType: recordTypeSchema,
  articleType: optionalArticleTypeSchema,
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
  outletId: z.string().optional(),
});

export const mediaListResponseSchema = z.object({
  records: z.array(mediaRecordSchema),
});

export const mediaInputSchema = z.object({
  recordType: recordTypeSchema,
  articleType: optionalArticleTypeSchema.default(""),
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

export const mediaFeatureSchema = z
  .object({
    title: z.string().trim().max(300).optional(),
    articleUrl: z.string().trim().max(2048).optional(),
    publicationDate: z.iso.date().optional(),
  })
  .openapi("MediaFeature");

export const mediaFeatureResponseSchema = z
  .object({ coverage: mediaRecordSchema, submission: mediaRecordSchema })
  .openapi("MediaFeatureResult");

export const outletTierValues = ["Tier 1", "Tier 2", "Tier 3"] as const;

export const outletSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    website: z.string().nullable(),
    contactName: z.string().nullable(),
    contactEmail: z.string().nullable(),
    tier: z.enum(outletTierValues).nullable(),
    notes: z.string().nullable(),
  })
  .openapi("PressOutlet");

export const outletUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Give the outlet a name.").max(200),
    website: z.string().trim().max(2048).nullable(),
    contactName: z.string().trim().max(200).nullable(),
    contactEmail: z.union([z.email("Enter a valid email address."), z.literal("")]).nullable(),
    tier: z.enum(outletTierValues).nullable(),
    notes: z.string().max(5000).nullable(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update")
  .openapi("PressOutletUpdate");
