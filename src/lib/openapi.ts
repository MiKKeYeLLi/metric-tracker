import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { mediaInputSchema, mediaListResponseSchema } from "@/lib/schemas/media";

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

export function getOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Metric Tracker API",
      version: "1.0.0",
      description: "REST API for Metric Tracker. Endpoints require an active NextAuth session unless noted.",
    },
    servers: [{ url: process.env.NEXTAUTH_URL ?? "http://localhost:3000", description: "Current environment" }],
  });
}
