import { z } from "@/lib/zod";

export const directoryStatusValues = ["Not submitted", "Pending review", "Needs changes", "Live", "Rejected"] as const;
export const directoryPriorityValues = ["High", "Medium", "Low"] as const;

const statusSchema = z.enum(directoryStatusValues);
const prioritySchema = z.enum(directoryPriorityValues);
const dateSchema = z.iso.date();

const httpUrl = (message: string) =>
  z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
      try {
        const parsed = new URL(value.includes("://") ? value : `https://${value}`);
        return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.includes(".");
      } catch {
        return false;
      }
    }, message);

const directoryFields = {
  name: z.string().trim().min(1, "Give the directory a name.").max(200),
  website: httpUrl("Enter the directory's website, like producthunt.com."),
  status: statusSchema,
  priority: prioritySchema,
  dateSubmitted: dateSchema.nullable(),
  listingUrl: z.union([httpUrl("Enter a valid listing link."), z.literal("")]).nullable(),
  notes: z.string().max(5000).nullable(),
};

export const directoryCreateSchema = z
  .object({
    name: directoryFields.name,
    website: directoryFields.website,
    status: directoryFields.status.default("Not submitted"),
    priority: directoryFields.priority.default("Medium"),
    dateSubmitted: directoryFields.dateSubmitted.optional(),
    listingUrl: directoryFields.listingUrl.optional(),
    notes: directoryFields.notes.optional(),
  })
  .openapi("DirectoryCreate");

export const directoryUpdateSchema = z
  .object(directoryFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update")
  .openapi("DirectoryUpdate");

export const checklistItemSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    done: z.boolean(),
    isDefault: z.boolean(),
    position: z.number().int(),
  })
  .openapi("DirectoryChecklistItem");

export const directorySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    website: z.string(),
    status: statusSchema,
    priority: prioritySchema,
    dateSubmitted: dateSchema.nullable(),
    listingUrl: z.string().nullable(),
    notes: z.string().nullable(),
    checklist: z.array(checklistItemSchema),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .openapi("Directory");

export const directoryActivitySchema = z
  .object({
    id: z.string(),
    directoryId: z.string().nullable(),
    directoryName: z.string(),
    message: z.string(),
    status: statusSchema.nullable(),
    createdAt: z.iso.datetime(),
  })
  .openapi("DirectoryActivity");

export const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const checklistItemCreateSchema = z
  .object({ label: z.string().trim().min(1, "Write the requirement.").max(200) })
  .openapi("DirectoryChecklistItemCreate");

export const checklistItemUpdateSchema = z
  .object({
    label: z.string().trim().min(1).max(200),
    done: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update")
  .openapi("DirectoryChecklistItemUpdate");

export const directoryErrorSchema = z
  .object({
    error: z.string(),
    details: z.record(z.string(), z.array(z.string())).optional(),
  })
  .openapi("DirectoryError");
