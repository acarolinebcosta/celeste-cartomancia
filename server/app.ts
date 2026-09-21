import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyBaseLogger } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { loadConfig, type AppConfig } from "./config/env.js";
import { createPrismaClient } from "./db/prisma.js";
import { registerErrorHandler } from "./middleware/errorHandler.js";
import { PrismaAvailabilityRepository } from "./repositories/prismaAvailabilityRepository.js";
import { PrismaBookingRepository } from "./repositories/prismaBookingRepository.js";
import { PrismaServiceRepository } from "./repositories/prismaServiceRepository.js";
import { availabilityRoutes } from "./routes/availabilityRoutes.js";
import { bookingRoutes } from "./routes/bookingRoutes.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { serviceRoutes } from "./routes/serviceRoutes.js";
import { AvailabilityService } from "./services/availabilityService.js";
import { BookingService } from "./services/bookingService.js";
import { ServiceCatalogService } from "./services/serviceCatalogService.js";

type BuildAppOptions = {
  config?: AppConfig;
  prisma?: PrismaClient;
  logger?: FastifyBaseLogger | false;
  clock?: () => Date;
};

export async function buildApp(options: BuildAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const ownsPrisma = !options.prisma;
  const prisma = options.prisma ?? createPrismaClient(config.databaseUrl);
  const app = Fastify({
    logger: options.logger ?? (config.nodeEnv === "test" ? false : {
      level: "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.customer",
        "req.body.question",
        "req.body.context",
      ],
    }),
    bodyLimit: 32 * 1024,
    requestIdHeader: "x-request-id",
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: (origin, callback) => callback(null, !origin || origin === config.frontendOrigin),
  });
  await app.register(rateLimit, { global: true, max: 100, timeWindow: "1 minute" });
  await app.register(swagger, {
    openapi: {
      info: { title: "Celeste Booking API", version: "1.0.0" },
      servers: [{ url: "/api" }],
    },
  });
  if (config.enableSwagger && config.nodeEnv !== "production") {
    await app.register(swaggerUi, { routePrefix: "/api/docs" });
  }

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  const serviceRepository = new PrismaServiceRepository(prisma);
  const availabilityRepository = new PrismaAvailabilityRepository(prisma);
  const bookingRepository = new PrismaBookingRepository(prisma);
  const catalog = new ServiceCatalogService(serviceRepository);
  const availability = new AvailabilityService(catalog, availabilityRepository, config.businessTimezone, options.clock);
  const bookings = new BookingService(catalog, availability, bookingRepository, {
    timezone: config.businessTimezone,
    holdMinutes: config.bookingHoldMinutes,
    termsVersion: config.termsVersion,
    privacyVersion: config.privacyVersion,
  }, options.clock);

  await app.register(healthRoutes(prisma), { prefix: "/api" });
  await app.register(serviceRoutes(catalog), { prefix: "/api" });
  await app.register(availabilityRoutes(availability), { prefix: "/api" });
  await app.register(bookingRoutes(bookings), { prefix: "/api" });
  registerErrorHandler(app);

  if (ownsPrisma) app.addHook("onClose", async () => prisma.$disconnect());
  return app;
}
