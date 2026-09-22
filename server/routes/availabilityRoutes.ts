import type { FastifyPluginAsync } from "fastify";
import { availabilityQuerySchema, toDomainModality } from "../schemas/bookingSchemas.js";
import { availabilityQueryOpenApiSchema, errorResponseSchema } from "../schemas/openapi.js";
import type { AvailabilityService } from "../services/availabilityService.js";

export function availabilityRoutes(service: AvailabilityService): FastifyPluginAsync {
  return async (app) => {
    app.get("/availability", {
      schema: {
        tags: ["Availability"],
        querystring: availabilityQueryOpenApiSchema,
        response: {
          200: {
            type: "object",
            required: ["timezone", "fulfillmentType", "dates"],
            properties: {
              timezone: { type: "string" },
              fulfillmentType: { const: "SCHEDULED" },
              dates: {
                type: "array",
                items: {
                  type: "object",
                  required: ["date", "slots"],
                  properties: {
                    date: { type: "string", format: "date" },
                    slots: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["startTime", "available"],
                        properties: { startTime: { type: "string" }, available: { const: true } },
                      },
                    },
                  },
                },
              },
            },
          },
          400: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    }, async (request) => {
      const query = availabilityQuerySchema.parse(request.query);
      return service.getAvailability({ ...query, modality: toDomainModality(query.modality) });
    });
  };
}
