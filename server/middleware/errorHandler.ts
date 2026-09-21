import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../errors/appError.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | ZodError | AppError, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Os dados enviados são inválidos.",
          details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      });
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
      });
    }
    if ("validation" in error && error.validation) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: "Os dados enviados são inválidos." } });
    }

    request.log.error({ err: error }, "unhandled request error");
    return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "Não foi possível concluir a solicitação." } });
  });
}
