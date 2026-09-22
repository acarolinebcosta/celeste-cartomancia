import type { FastifyPluginAsync } from "fastify";
import type { ServiceCatalogService } from "../services/serviceCatalogService.js";
import { errorResponseSchema } from "../schemas/openapi.js";

export function serviceRoutes(catalog: ServiceCatalogService): FastifyPluginAsync {
  return async (app) => {
    app.get("/services", {
      schema: {
        tags: ["Services"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              required: ["slug", "name", "eyebrow", "description", "audience", "explores", "fulfillmentType", "durationMinutes", "priceCents", "availableModalities"],
              properties: {
                slug: { type: "string" },
                name: { type: "string" },
                eyebrow: { type: "string" },
                description: { type: "string" },
                audience: { type: "string" },
                explores: { type: "array", items: { type: "string" } },
                fulfillmentType: { enum: ["async", "scheduled"] },
                durationMinutes: { anyOf: [{ type: "integer" }, { type: "null" }] },
                priceCents: { type: "integer" },
                featured: { type: "boolean" },
                availableModalities: { type: "array", items: { enum: ["message", "voice", "video"] } },
                estimatedDelivery: { type: "string" },
              },
            },
          },
          500: errorResponseSchema,
        },
      },
    }, () => catalog.listActive());
  };
}
