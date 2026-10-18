import { z } from "@/lib/zod";

const contentTypeSchema = z.enum(["Article", "Social post", "Video", "Newsletter"]);
// An empty string means "not set yet": every field is optional so a piece can start as a bare idea.
const optionalContentTypeSchema = z.union([contentTypeSchema, z.literal("")]);
const contentStatusSchema = z.enum(["Idea", "Draft", "Scheduled", "Published", "Archived"]);
const contentDateSchema = z.iso.date();

const contentFields = {
  title: z.string().trim().max(200),
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
      if (value === "") return true;
      try {
        const parsed = new URL(value.includes("://") ? value : `https://${value}`);
        return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length > 0;
      } catch {
        return false;
      }
    }, "Enter a valid HTTP or HTTPS URL"),
  type: optionalContentTypeSchema,
  platform: z.string().trim().max(100),
  topics: z.array(z.string().trim().min(1).max(80)).max(30),
  status: contentStatusSchema,
  createdDate: contentDateSchema,
  publishDate: contentDateSchema.nullable(),
  updatedDate: contentDateSchema.nullable(),
  notes: z.string().max(10000).nullable(),
};

export const contentCreateSchema = z
  .object({
    title: contentFields.title.default(""),
    url: contentFields.url.default(""),
    type: contentFields.type.default(""),
    platform: contentFields.platform.default(""),
    topics: contentFields.topics.default([]),
    status: contentFields.status.default("Idea"),
    createdDate: contentFields.createdDate.optional(),
    publishDate: contentFields.publishDate.optional(),
    updatedDate: contentFields.updatedDate.optional(),
    notes: contentFields.notes.optional(),
  })
  .openapi("ContentCreate");

export const contentUpdateSchema = z
  .object(contentFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update")
  .openapi("ContentUpdate");

export const contentItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    type: optionalContentTypeSchema,
    platform: z.string(),
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