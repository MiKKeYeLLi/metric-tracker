import { z } from "@/lib/zod";

const contentTypeSchema = z.enum(["Article", "Social post", "Video", "Newsletter"]);
const contentStatusSchema = z.enum(["Idea", "Draft", "Scheduled", "Published", "Archived"]);
const contentDateSchema = z.iso.date();
const topicsSchema = z.array(z.string().trim().min(1).max(80)).max(30).default([]);

const contentFields = {
  title: z.string().trim().min(1).max(200),
  url: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine((value) => {
      try {
        const parsed = new URL(value.includes("://") ? value : `https://${value}`);
        return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length > 0;
      } catch {
        return false;
      }
    }, "Enter a valid HTTP or HTTPS URL"),
  type: contentTypeSchema,
  platform: z.string().trim().min(1).max(100),
  topics: topicsSchema,
  status: contentStatusSchema,
  createdDate: contentDateSchema,
  publishDate: contentDateSchema.nullable().optional(),
  updatedDate: contentDateSchema.nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
};

export const contentCreateSchema = z.object(contentFields).openapi("ContentCreate");

export const contentUpdateSchema = z
  .object(contentFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update")
  .openapi("ContentUpdate");

export const contentItemSchema = z
  .object({
    id: z.string(),
    title: contentFields.title,
    url: contentFields.url,
    type: contentTypeSchema,
    platform: contentFields.platform,
    topics: z.array(z.string()),
    status: contentStatusSchema,
    createdDate: contentDateSchema,
    publishDate: contentDateSchema.nullable(),
    updatedDate: contentDateSchema.nullable(),
    notes: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi("ContentItem");

export const contentErrorSchema = z
  .object({
    error: z.string(),
    details: z.record(z.string(), z.array(z.string())).optional(),
  })
  .openapi("ContentError");