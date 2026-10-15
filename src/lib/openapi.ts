import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  DirectoryBodySchema,
  ProductBodySchema,
  CreateSubmissionBodySchema,
  UpdateSubmissionBodySchema,
  TrafficBodySchema,
  SubmissionStatusSchema,
} from "./schemas";

const registry = new OpenAPIRegistry();

// ── Component schemas ─────────────────────────────────────────────────────────

const IdField = z.string().openapi({ example: "clxxxxxxxxxxxxxxxx" });
const DateTimeField = z.string().datetime().openapi({ example: "2026-10-15T00:00:00.000Z" });

const DirectorySchema = registry.register(
  "Directory",
  DirectoryBodySchema.extend({
    id: IdField,
    createdAt: DateTimeField,
    updatedAt: DateTimeField,
    _count: z.object({ submissions: z.number().int().openapi({ example: 3 }) }),
  }).openapi("Directory"),
);

const ProductSchema = registry.register(
  "Product",
  ProductBodySchema.extend({
    id: IdField,
    createdAt: DateTimeField,
    updatedAt: DateTimeField,
  }).openapi("Product"),
);

const SubmissionSchema = registry.register(
  "Submission",
  z.object({
    id: IdField,
    productId: IdField,
    directoryId: IdField,
    status: SubmissionStatusSchema,
    submittedAt: DateTimeField.nullable(),
    listingUrl: z.string().url().nullable().openapi({ example: "https://www.producthunt.com/posts/zeduchat" }),
    createdAt: DateTimeField,
    updatedAt: DateTimeField,
    product: z.object({ id: IdField, name: z.string(), url: z.string() }),
    directory: z.object({ id: IdField, name: z.string(), url: z.string() }),
    _count: z.object({ traffic: z.number().int().openapi({ example: 5 }) }),
  }).openapi("Submission"),
);

const TrafficSchema = registry.register(
  "Traffic",
  z.object({
    id: IdField,
    submissionId: IdField,
    date: z.string().openapi({ example: "2026-10-15" }),
    visits: z.number().int().openapi({ example: 1200 }),
    createdAt: DateTimeField,
  }).openapi("Traffic"),
);

const ErrorSchema = registry.register(
  "Error",
  z.object({
    error: z.string().openapi({ example: "Validation failed" }),
    details: z.record(z.string(), z.array(z.string())).optional().openapi({
      example: { name: ["Name is required"] },
    }),
  }).openapi("Error"),
);

// ── Security ──────────────────────────────────────────────────────────────────

registry.registerComponent("securitySchemes", "sessionCookie", {
  type: "apiKey",
  in: "cookie",
  name: "next-auth.session-token",
  description: "NextAuth session cookie — obtained after Google OAuth sign-in at `/api/auth/signin`.",
});

const auth = [{ sessionCookie: [] }];

// ── Shared response shorthands ────────────────────────────────────────────────

const r400 = {
  description: "Validation error",
  content: { "application/json": { schema: ErrorSchema } },
};
const r401 = { description: "Unauthorized — no active session" };
const r404 = { description: "Not found" };

// ── Directories ───────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/directories",
  tags: ["Directories"],
  summary: "List all directories",
  description: "Returns every directory with the number of submissions linked to it.",
  security: auth,
  responses: {
    200: {
      description: "List of directories",
      content: { "application/json": { schema: z.array(DirectorySchema) } },
    },
    401: r401,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/directories",
  tags: ["Directories"],
  summary: "Create a directory",
  security: auth,
  request: {
    body: { required: true, content: { "application/json": { schema: DirectoryBodySchema } } },
  },
  responses: {
    201: { description: "Directory created", content: { "application/json": { schema: DirectorySchema } } },
    400: r400,
    401: r401,
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/directories/{id}",
  tags: ["Directories"],
  summary: "Delete a directory",
  description: "Cascades — deletes all submissions (and their traffic) linked to this directory.",
  security: auth,
  request: { params: z.object({ id: IdField }) },
  responses: { 204: { description: "Deleted" }, 401: r401, 404: r404 },
});

// ── Products ──────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/products",
  tags: ["Products"],
  summary: "List all products",
  security: auth,
  responses: {
    200: {
      description: "List of products",
      content: { "application/json": { schema: z.array(ProductSchema) } },
    },
    401: r401,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/products",
  tags: ["Products"],
  summary: "Create a product",
  security: auth,
  request: {
    body: { required: true, content: { "application/json": { schema: ProductBodySchema } } },
  },
  responses: {
    201: { description: "Product created", content: { "application/json": { schema: ProductSchema } } },
    400: r400,
    401: r401,
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/products/{id}",
  tags: ["Products"],
  summary: "Delete a product",
  description: "Cascades — deletes all submissions (and their traffic) linked to this product.",
  security: auth,
  request: { params: z.object({ id: IdField }) },
  responses: { 204: { description: "Deleted" }, 401: r401, 404: r404 },
});

// ── Submissions ───────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/submissions",
  tags: ["Submissions"],
  summary: "List all submissions",
  description: "Returns every submission with its product, directory, and traffic entry count.",
  security: auth,
  responses: {
    200: {
      description: "List of submissions",
      content: { "application/json": { schema: z.array(SubmissionSchema) } },
    },
    401: r401,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/submissions",
  tags: ["Submissions"],
  summary: "Create a submission",
  security: auth,
  request: {
    body: { required: true, content: { "application/json": { schema: CreateSubmissionBodySchema } } },
  },
  responses: {
    201: { description: "Submission created", content: { "application/json": { schema: SubmissionSchema } } },
    400: r400,
    401: r401,
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/submissions/{id}",
  tags: ["Submissions"],
  summary: "Update a submission",
  description:
    "Updates `status` and/or `listingUrl`. Automatically sets `submittedAt` to now when status is changed to `submitted` and no `submittedAt` is provided.",
  security: auth,
  request: {
    params: z.object({ id: IdField }),
    body: { required: true, content: { "application/json": { schema: UpdateSubmissionBodySchema } } },
  },
  responses: {
    200: { description: "Updated submission", content: { "application/json": { schema: SubmissionSchema } } },
    400: r400,
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/submissions/{id}",
  tags: ["Submissions"],
  summary: "Delete a submission",
  description: "Cascades — deletes all traffic entries linked to this submission.",
  security: auth,
  request: { params: z.object({ id: IdField }) },
  responses: { 204: { description: "Deleted" }, 401: r401, 404: r404 },
});

// ── Traffic ───────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/submissions/{id}/traffic",
  tags: ["Traffic"],
  summary: "Add a traffic entry",
  description: "Logs a daily visit count against a submission.",
  security: auth,
  request: {
    params: z.object({ id: IdField }),
    body: { required: true, content: { "application/json": { schema: TrafficBodySchema } } },
  },
  responses: {
    201: { description: "Traffic entry created", content: { "application/json": { schema: TrafficSchema } } },
    400: r400,
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/submissions/{id}/traffic/{trafficId}",
  tags: ["Traffic"],
  summary: "Delete a traffic entry",
  security: auth,
  request: { params: z.object({ id: IdField, trafficId: IdField }) },
  responses: { 204: { description: "Deleted" }, 401: r401, 404: r404 },
});

// ── Document generator ────────────────────────────────────────────────────────

export function getOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Metric Tracker API",
      version: "1.0.0",
      description:
        "REST API for tracking directory submissions across products. All endpoints require an active NextAuth session.",
    },
    servers: [{ url: process.env.NEXTAUTH_URL ?? "http://localhost:3000", description: "Current environment" }],
  });
}
