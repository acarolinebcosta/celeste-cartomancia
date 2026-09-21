export type ErrorCode =
  | "VALIDATION_ERROR"
  | "SERVICE_NOT_FOUND"
  | "SERVICE_INACTIVE"
  | "INVALID_MODALITY"
  | "INVALID_FULFILLMENT"
  | "SLOT_UNAVAILABLE"
  | "BOOKING_NOT_FOUND"
  | "IDEMPOTENCY_CONFLICT"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  serviceNotFound: () => new AppError("SERVICE_NOT_FOUND", 404, "Serviço não encontrado."),
  serviceInactive: () => new AppError("SERVICE_INACTIVE", 422, "Este serviço não está disponível."),
  invalidModality: () => new AppError("INVALID_MODALITY", 422, "Modalidade incompatível com o serviço."),
  invalidFulfillment: (message: string) => new AppError("INVALID_FULFILLMENT", 422, message),
  slotUnavailable: () => new AppError("SLOT_UNAVAILABLE", 409, "Esse horário não está mais disponível."),
  bookingNotFound: () => new AppError("BOOKING_NOT_FOUND", 404, "Reserva não encontrada."),
  idempotencyConflict: () => new AppError("IDEMPOTENCY_CONFLICT", 409, "A chave de idempotência já foi usada com outro conteúdo."),
};
