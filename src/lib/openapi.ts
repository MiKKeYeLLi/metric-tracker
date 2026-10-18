import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "@/lib/zod";
import {
  contentCreateSchema,
  contentErrorSchema,
  contentItemSchema,
  contentUpdateSchema,
} from "@/lib/schemas/content";
import {
  checklistItemCreateSchema,
  checklistItemSchema,
  checklistItemUpdateSchema,
  directoryActivitySchema,
  directoryCreateSchema,
  directoryErrorSchema,
  directorySchema,
  directoryUpdateSchema,
  savedCopyCreateSchema,
  savedCopySchema,
  savedCopyUpdateSchema,
} from "@/lib/schemas/directories";
import {
  mediaFeatureResponseSchema,
  mediaFeatureSchema,
  mediaInputSchema,
  mediaListResponseSchema,
  mediaRecordSchema,
  outletSchema,
  outletUpdateSchema,
} from "@/lib/schemas/media";

// Register request/response schemas and paths here; they appear at /docs.
export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "sessionCookie", {
  type: "apiKey",
  in: "cookie",
  name: "next-auth.session-token",
  description: "NextAuth session cookie — obtained after Google OAuth sign-in at `/api/auth/signin`.",
});

registry.registerPath({
  method: "get",
  path: "/api/content",
  operationId: "listContent",
  tags: ["Content"],
  security: [{ sessionCookie: [] }],
  responses: {
    200: {
      description: "Content shared across the workspace",
      content: { "application/json": { schema: contentItemSchema.array() } },
    },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/content",
  operationId: "createContent",
  tags: ["Content"],
  security: [{ sessionCookie: [] }],
  request: { body: { content: { "application/json": { schema: contentCreateSchema } } } },
  responses: {
    201: {
      description: "Content created",
      content: { "application/json": { schema: contentItemSchema } },
    },
    400: {
      description: "Validation failed",
      content: { "application/json": { schema: contentErrorSchema } },
    },
    401: { description: "Unauthorized" },
  },
});

const contentIdParams = z.object({
  id: z.string().openapi({ param: { name: "id", in: "path" } }),
});

registry.registerPath({
  method: "get",
  path: "/api/content/{id}",
  operationId: "getContent",
  tags: ["Content"],
  security: [{ sessionCookie: [] }],
  request: { params: contentIdParams },
  responses: {
    200: {
      description: "Content item",
      content: { "application/json": { schema: contentItemSchema } },
    },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/content/{id}",
  operationId: "updateContent",
  tags: ["Content"],
  security: [{ sessionCookie: [] }],
  request: {
    params: contentIdParams,
    body: { content: { "application/json": { schema: contentUpdateSchema } } },
  },
  responses: {
    200: {
      description: "Content updated",
      content: { "application/json": { schema: contentItemSchema } },
    },
    400: {
      description: "Validation failed",
      content: { "application/json": { schema: contentErrorSchema } },
    },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/content/{id}",
  operationId: "deleteContent",
  tags: ["Content"],
  security: [{ sessionCookie: [] }],
  request: { params: contentIdParams },
  responses: {
    204: { description: "Content deleted" },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

// ── Media ──
registry.registerPath({
  method: "get",
  path: "/api/media",
  summary: "List media records",
  security: [{ sessionCookie: [] }],
  responses: {
    200: {
      description: "A list of coverage and submission records.",
      content: {
        "application/json": {
          schema: mediaListResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/media",
  summary: "Create a press media record",
  security: [{ sessionCookie: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: mediaInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "The created media record.",
      content: {
        "application/json": {
          schema: mediaInputSchema,
        },
      },
    },
  },
});

const mediaIdParams = z.object({ id: z.string().openapi({ description: "Coverage or submission id" }) });

registry.registerPath({
  method: "put",
  path: "/api/media/{id}",
  summary: "Update a coverage or submission record (its record type can't change)",
  security: [{ sessionCookie: [] }],
  request: { params: mediaIdParams, body: { content: { "application/json": { schema: mediaInputSchema } } } },
  responses: {
    200: { description: "The updated record", content: { "application/json": { schema: mediaRecordSchema } } },
    400: { description: "Validation failed, or the record type doesn't match" },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/media/{id}",
  summary: "Delete a coverage or submission record",
  security: [{ sessionCookie: [] }],
  request: { params: mediaIdParams },
  responses: {
    204: { description: "Deleted" },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/media/{id}/feature",
  summary: "Mark a pitch as featured: creates the coverage and links the pitch in one transaction",
  security: [{ sessionCookie: [] }],
  request: { params: mediaIdParams, body: { content: { "application/json": { schema: mediaFeatureSchema } } } },
  responses: {
    201: { description: "Coverage created and pitch linked", content: { "application/json": { schema: mediaFeatureResponseSchema } } },
    400: { description: "Validation failed, or the pitch is already featured" },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/media/outlets",
  summary: "List press outlets with their details",
  security: [{ sessionCookie: [] }],
  responses: {
    200: { description: "Outlets by name", content: { "application/json": { schema: outletSchema.array() } } },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/media/outlets/{id}",
  summary: "Update an outlet's details; renaming also renames it on its coverage and pitches",
  security: [{ sessionCookie: [] }],
  request: { params: mediaIdParams, body: { content: { "application/json": { schema: outletUpdateSchema } } } },
  responses: {
    200: { description: "The updated outlet", content: { "application/json": { schema: outletSchema } } },
    400: { description: "Validation failed, or another outlet already uses that name" },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

// ── Directories ──
const directoryIdParams = z.object({ id: z.string().openapi({ description: "Directory id" }) });
const checklistItemParams = directoryIdParams.extend({ itemId: z.string().openapi({ description: "Checklist item id" }) });
const directoryError = { content: { "application/json": { schema: directoryErrorSchema } } };

registry.registerPath({
  method: "get",
  path: "/api/directories",
  operationId: "listDirectories",
  tags: ["Directories"],
  summary: "List directories with their checklists",
  security: [{ sessionCookie: [] }],
  responses: {
    200: { description: "Every directory, newest first", content: { "application/json": { schema: directorySchema.array() } } },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/directories",
  operationId: "createDirectory",
  tags: ["Directories"],
  summary: "Add a directory (gets the standard checklist and an activity entry)",
  security: [{ sessionCookie: [] }],
  request: { body: { content: { "application/json": { schema: directoryCreateSchema } } } },
  responses: {
    201: { description: "Directory created", content: { "application/json": { schema: directorySchema } } },
    400: { description: "Validation failed", ...directoryError },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/directories/{id}",
  operationId: "getDirectory",
  tags: ["Directories"],
  security: [{ sessionCookie: [] }],
  request: { params: directoryIdParams },
  responses: {
    200: { description: "The directory", content: { "application/json": { schema: directorySchema } } },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/directories/{id}",
  operationId: "updateDirectory",
  tags: ["Directories"],
  summary: "Update a directory. Status changes and new listing links are logged to activity.",
  security: [{ sessionCookie: [] }],
  request: { params: directoryIdParams, body: { content: { "application/json": { schema: directoryUpdateSchema } } } },
  responses: {
    200: { description: "Directory updated", content: { "application/json": { schema: directorySchema } } },
    400: { description: "Validation failed", ...directoryError },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/directories/{id}",
  operationId: "deleteDirectory",
  tags: ["Directories"],
  summary: "Delete a directory and its checklist; the removal is logged to activity",
  security: [{ sessionCookie: [] }],
  request: { params: directoryIdParams },
  responses: {
    204: { description: "Directory deleted" },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/directories/activity",
  operationId: "listDirectoryActivity",
  tags: ["Directories"],
  summary: "Recent directory activity, newest first",
  security: [{ sessionCookie: [] }],
  request: { query: z.object({ limit: z.number().int().min(1).max(100).optional().openapi({ description: "Default 20" }) }) },
  responses: {
    200: { description: "Activity entries", content: { "application/json": { schema: directoryActivitySchema.array() } } },
    400: { description: "Validation failed", ...directoryError },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/directories/{id}/checklist",
  operationId: "addDirectoryChecklistItem",
  tags: ["Directories"],
  summary: "Add a custom checklist requirement",
  security: [{ sessionCookie: [] }],
  request: { params: directoryIdParams, body: { content: { "application/json": { schema: checklistItemCreateSchema } } } },
  responses: {
    201: { description: "Item added", content: { "application/json": { schema: checklistItemSchema } } },
    400: { description: "Validation failed", ...directoryError },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/directories/{id}/checklist/{itemId}",
  operationId: "updateDirectoryChecklistItem",
  tags: ["Directories"],
  summary: "Tick, untick or rename a checklist item",
  security: [{ sessionCookie: [] }],
  request: { params: checklistItemParams, body: { content: { "application/json": { schema: checklistItemUpdateSchema } } } },
  responses: {
    200: { description: "Item updated", content: { "application/json": { schema: checklistItemSchema } } },
    400: { description: "Validation failed", ...directoryError },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/directories/{id}/checklist/{itemId}",
  operationId: "deleteDirectoryChecklistItem",
  tags: ["Directories"],
  security: [{ sessionCookie: [] }],
  request: { params: checklistItemParams },
  responses: {
    204: { description: "Item deleted" },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

const savedCopyParams = z.object({ id: z.string().openapi({ description: "Saved copy id" }) });

registry.registerPath({
  method: "get",
  path: "/api/directories/copy",
  operationId: "listSavedCopy",
  tags: ["Directories"],
  summary: "Team-wide saved submission copy",
  security: [{ sessionCookie: [] }],
  responses: {
    200: { description: "Saved copy in display order", content: { "application/json": { schema: savedCopySchema.array() } } },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/directories/copy",
  operationId: "createSavedCopy",
  tags: ["Directories"],
  security: [{ sessionCookie: [] }],
  request: { body: { content: { "application/json": { schema: savedCopyCreateSchema } } } },
  responses: {
    201: { description: "Copy saved", content: { "application/json": { schema: savedCopySchema } } },
    400: { description: "Validation failed", ...directoryError },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/directories/copy/{id}",
  operationId: "updateSavedCopy",
  tags: ["Directories"],
  security: [{ sessionCookie: [] }],
  request: { params: savedCopyParams, body: { content: { "application/json": { schema: savedCopyUpdateSchema } } } },
  responses: {
    200: { description: "Copy updated", content: { "application/json": { schema: savedCopySchema } } },
    400: { description: "Validation failed", ...directoryError },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/directories/copy/{id}",
  operationId: "deleteSavedCopy",
  tags: ["Directories"],
  security: [{ sessionCookie: [] }],
  request: { params: savedCopyParams },
  responses: {
    204: { description: "Copy deleted" },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

export function getOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Zedu Amp API",
      version: "1.0.0",
      description: "REST API for Zedu Amp. Endpoints require an active NextAuth session unless noted.",
    },
    servers: [{ url: process.env.NEXTAUTH_URL ?? "http://localhost:3000", description: "Current environment" }],
  });
}
