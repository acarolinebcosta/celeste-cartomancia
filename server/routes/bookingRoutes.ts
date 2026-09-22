import type { FastifyPluginAsync } from "fastify";
import { createBookingSchema, idempotencyKeySchema, publicCodeSchema } from "../schemas/bookingSchemas.js";
import { createBookingBodySchema, errorResponseSchema, publicBookingSchema } from "../schemas/openapi.js";
import type { BookingService } from "../services/bookingService.js";

export function bookingRoutes(service: BookingService): FastifyPluginAsync {
  return async (app) => {
    app.post("/bookings", {
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
      schema: {
        tags: ["Bookings"],
        headers: {
          type: "object",
          required: ["idempotency-key"],
          properties: { "idempotency-key": { type: "string", minLength: 8, maxLength: 128 } },
        },
        body: createBookingBodySchema,
        response: {
          200: publicBookingSchema,
          201: publicBookingSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    }, async (request, reply) => {
      const payload = createBookingSchema.parse(request.body);
      const idempotencyKey = idempotencyKeySchema.parse(request.headers["idempotency-key"]);
      const result = await service.create(payload, idempotencyKey);
      reply.header("idempotency-replayed", String(result.replayed));
      request.log.info({
        publicCode: result.booking.publicCode,
        serviceSlug: result.booking.service.slug,
        status: result.booking.status,
        replayed: result.replayed,
      }, "booking created");
      return reply.status(result.replayed ? 200 : 201).send(result.booking);
    });

    app.get<{ Params: { publicCode: string } }>("/bookings/:publicCode", {
      schema: {
        tags: ["Bookings"],
        params: {
          type: "object",
          required: ["publicCode"],
          properties: { publicCode: { type: "string", pattern: "^CEL-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$" } },
        },
        response: {
          200: publicBookingSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    }, async (request) => service.getByPublicCode(publicCodeSchema.parse(request.params.publicCode)));
  };
}
