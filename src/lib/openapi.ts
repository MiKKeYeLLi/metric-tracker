import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import {
  searchPerformanceResponseSchema,
  seoErrorResponseSchema,
  seoRangeQueryFields,
  trafficChannelsResponseSchema,
} from "@/lib/schemas/seo";

// Register request/response schemas and paths here; they appear at /docs.
export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "sessionCookie", {
  type: "apiKey",
  in: "cookie",
  name: "next-auth.session-token",
  description: "NextAuth session cookie — obtained after Google OAuth sign-in at `/api/auth/signin`.",
});

// ── SEO Analytics ──
const seoErrorResponses = {
  400: { description: "Invalid date range" },
  401: { description: "Not signed in" },
  429: { description: "Google API quota exceeded", content: { "application/json": { schema: seoErrorResponseSchema } } },
  502: {
    description: "Google rejected the credentials or permissions, or the request failed",
    content: { "application/json": { schema: seoErrorResponseSchema } },
  },
  503: {
    description: "Analytics environment variables are not set",
    content: { "application/json": { schema: seoErrorResponseSchema } },
  },
};

registry.registerPath({
  method: "get",
  path: "/api/seo/search-performance",
  tags: ["SEO Analytics"],
  summary: "Daily Google Search clicks, impressions and CTR (Search Console)",
  security: [{ sessionCookie: [] }],
  request: { query: seoRangeQueryFields },
  responses: {
    200: { description: "Search performance", content: { "application/json": { schema: searchPerformanceResponseSchema } } },
    ...seoErrorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/seo/traffic-channels",
  tags: ["SEO Analytics"],
  summary: "Daily GA4 active users by session default channel group",
  security: [{ sessionCookie: [] }],
  request: { query: seoRangeQueryFields },
  responses: {
    200: { description: "Traffic by channel", content: { "application/json": { schema: trafficChannelsResponseSchema } } },
    ...seoErrorResponses,
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
