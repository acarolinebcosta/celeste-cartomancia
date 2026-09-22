import type { FastifyPluginAsync } from "fastify";
import type { PrismaClient } from "@prisma/client";

export function healthRoutes(prisma: PrismaClient): FastifyPluginAsync {
  return async (app) => {
    app.get("/health", {
      schema: {
        tags: ["System"],
        response: {
          200: {
            type: "object",
            required: ["status", "database"],
            properties: { status: { const: "ok" }, database: { const: "ok" } },
          },
          503: {
            type: "object",
            required: ["status", "database"],
            properties: { status: { const: "degraded" }, database: { const: "unavailable" } },
          },
        },
      },
    }, async (_request, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: "ok", database: "ok" };
      } catch {
        return reply.status(503).send({ status: "degraded", database: "unavailable" });
      }
    });
  };
}
