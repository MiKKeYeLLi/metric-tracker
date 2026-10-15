import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const DirectoryBodySchema = z.object({
  name: z.string().min(1, "Name is required").openapi({ example: "Product Hunt" }),
  url: z.string().url("Must be a valid URL").openapi({ example: "https://www.producthunt.com" }),
});

export const ProductBodySchema = z.object({
  name: z.string().min(1, "Name is required").openapi({ example: "Zeduchat" }),
  url: z.string().url("Must be a valid URL").openapi({ example: "https://zeduchat.com" }),
});

export const SubmissionStatusSchema = z
  .enum(["planned", "submitted", "live", "rejected"])
  .openapi({ example: "planned" });

export const CreateSubmissionBodySchema = z.object({
  productId: z.string().min(1, "productId is required").openapi({ example: "clxxxxxxxxxxxxxxxx" }),
  directoryId: z.string().min(1, "directoryId is required").openapi({ example: "clxxxxxxxxxxxxxxxx" }),
  status: SubmissionStatusSchema.optional().default("planned"),
  submittedAt: z.string().datetime().nullable().optional().openapi({ example: "2026-10-15T00:00:00Z" }),
  listingUrl: z.string().url().nullable().optional().openapi({ example: "https://www.producthunt.com/posts/zeduchat" }),
});

export const UpdateSubmissionBodySchema = z.object({
  status: SubmissionStatusSchema.optional(),
  listingUrl: z.string().url().nullable().optional().openapi({ example: "https://www.producthunt.com/posts/zeduchat" }),
  submittedAt: z.string().datetime().nullable().optional().openapi({ example: "2026-10-15T00:00:00Z" }),
});

export const TrafficBodySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
    .openapi({ example: "2026-10-15" }),
  visits: z.number().int().nonnegative().openapi({ example: 1200 }),
});
