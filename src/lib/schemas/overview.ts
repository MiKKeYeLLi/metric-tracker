import { z } from "@/lib/zod";

const pointList = z.array(z.string().trim().min(1).max(300)).max(5);

export const overviewSummarySchema = z
  .object({
    headline: z.string().trim().min(1).max(300),
    highlights: pointList,
    risks: pointList,
    nextSteps: pointList,
    generatedAt: z.iso.datetime(),
  })
  .openapi("OverviewSummary");

/** What the model must return; `generatedAt` is added by the server. */
export const overviewSummaryModelSchema = overviewSummarySchema.omit({ generatedAt: true });

export const overviewErrorSchema = z.object({ error: z.string() }).openapi("OverviewError");

export type OverviewSummary = z.infer<typeof overviewSummarySchema>;
