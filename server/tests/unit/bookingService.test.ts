import { describe, expect, it } from "vitest";
import type { BookingRecord, ServiceRecord } from "../../domain/types.js";
import type { AtomicBookingInput, BookingRepository, ServiceRepository } from "../../repositories/contracts.js";
import type { CreateBookingPayload } from "../../schemas/bookingSchemas.js";
import type { AvailabilityService } from "../../services/availabilityService.js";
import { BookingService } from "../../services/bookingService.js";
import { ServiceCatalogService } from "../../services/serviceCatalogService.js";
import { PublicCodeCollisionError } from "../../errors/repositoryErrors.js";

const asyncService: ServiceRecord = {
  id: "async-id",
  slug: "pergunta-direta",
  name: "Pergunta Direta",
  eyebrow: "",
  description: "",
  audience: "",
  explores: [],
  fulfillmentType: "ASYNC",
  durationMinutes: null,
  priceCents: 4_900,
  featured: false,
  estimatedDelivery: null,
  active: true,
  modalities: ["MESSAGE"],
};

const scheduledService: ServiceRecord = {
  ...asyncService,
  id: "scheduled-id",
  slug: "amor-relacoes",
  name: "Amor & Relações",
  fulfillmentType: "SCHEDULED",
  durationMinutes: 30,
  priceCents: 12_900,
  modalities: ["VOICE", "VIDEO"],
};

const customer = { name: "Ana", email: "ana@example.com", whatsapp: "51999999999" };
const asyncPayload: CreateBookingPayload = {
  serviceSlug: asyncService.slug,
  modality: "message",
  question: "Quais movimentos merecem minha atenção?",
  customer,
  context: "",
  termsAccepted: true,
  utms: {},
};

function setup(service: ServiceRecord, replayed = false, options: { collisions?: number; codes?: string[] } = {}) {
  let captured: AtomicBookingInput | undefined;
  let attempts = 0;
  const serviceRepository: ServiceRepository = { listActive: async () => [service], findBySlug: async () => service };
  const bookingRepository: BookingRepository = {
    createAtomic: async (input) => {
      attempts += 1;
      if (attempts <= (options.collisions ?? 0)) throw new PublicCodeCollisionError();
      captured = input;
      const booking: BookingRecord = {
        id: "internal-id",
        publicCode: input.publicCode,
        service: { slug: service.slug, name: service.name, durationMinutes: service.durationMinutes },
        fulfillmentType: input.fulfillmentType,
        modality: input.modality,
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        timezone: input.timezone,
        priceCents: input.priceCents,
        currency: "BRL",
        status: "PENDING_PAYMENT",
        paymentStatus: "AWAITING_PAYMENT",
        expiresAt: input.expiresAt,
        createdAt: input.termsAcceptedAt,
        idempotencyHash: input.idempotencyHash,
      };
      return { booking, replayed };
    },
    findByIdempotencyKey: async () => null,
    findByPublicCode: async () => null,
  };
  const availability = {
    assertSlotAvailable: async () => ({
      startsAt: new Date("2026-10-06T12:00:00Z"),
      endsAt: new Date("2026-10-06T12:30:00Z"),
      bufferMinutes: 15,
    }),
  } as unknown as AvailabilityService;
  const bookingService = new BookingService(
    new ServiceCatalogService(serviceRepository),
    availability,
    bookingRepository,
    { timezone: "America/Sao_Paulo", holdMinutes: 15, termsVersion: "terms-v1", privacyVersion: "privacy-v1" },
    () => new Date("2026-10-01T12:00:00Z"),
    () => options.codes?.shift() ?? "CEL-23456789AB",
  );
  return { bookingService, captured: () => captured, attempts: () => attempts };
}

describe("BookingService", () => {
  it("cria async sem agenda usando preço e consentimento do servidor", async () => {
    const context = setup(asyncService);
    const result = await context.bookingService.create({ ...asyncPayload, utms: { utm_source: "newsletter" } }, "async-key-123");
    expect(result.booking).toMatchObject({ publicCode: "CEL-23456789AB", priceCents: 4_900, status: "PENDING_PAYMENT", scheduledStart: null });
    expect(result.booking).not.toHaveProperty("id");
    expect(context.captured()).toMatchObject({
      priceCents: 4_900,
      termsVersion: "terms-v1",
      privacyVersion: "privacy-v1",
      utmSource: "newsletter",
      expiresAt: null,
    });
  });

  it("cria scheduled com hold de 15 minutos", async () => {
    const context = setup(scheduledService);
    await context.bookingService.create({
      serviceSlug: scheduledService.slug,
      modality: "video",
      date: "2026-10-06",
      time: "09:00",
      customer,
      context: "",
      termsAccepted: true,
      utms: {},
    }, "scheduled-key-123");
    expect(context.captured()).toMatchObject({
      scheduledStart: new Date("2026-10-06T12:00:00Z"),
      scheduledEnd: new Date("2026-10-06T12:30:00Z"),
      expiresAt: new Date("2026-10-01T12:15:00Z"),
      reservation: { lockDate: "2026-10-06", bufferMinutes: 15 },
    });
  });

  it("rejeita formatos incompatíveis com fulfillment e modalidade", async () => {
    await expect(setup(asyncService).bookingService.create({ ...asyncPayload, date: "2026-10-06", time: "09:00" }, "invalid-key-1"))
      .rejects.toMatchObject({ code: "INVALID_FULFILLMENT" });
    await expect(setup(asyncService).bookingService.create({ ...asyncPayload, question: undefined }, "invalid-key-2"))
      .rejects.toMatchObject({ code: "INVALID_FULFILLMENT" });
    await expect(setup(scheduledService).bookingService.create({ ...asyncPayload, serviceSlug: scheduledService.slug }, "invalid-key-3"))
      .rejects.toMatchObject({ code: "INVALID_MODALITY" });
    await expect(setup(scheduledService).bookingService.create({ ...asyncPayload, serviceSlug: scheduledService.slug, modality: "voice", question: undefined }, "invalid-key-4"))
      .rejects.toMatchObject({ code: "INVALID_FULFILLMENT" });
  });

  it("preserva sinal de replay idempotente", async () => {
    await expect(setup(asyncService, true).bookingService.create(asyncPayload, "replayed-key-123"))
      .resolves.toMatchObject({ replayed: true });
  });

  it("retorna somente projeção pública e trata booking ausente", async () => {
    const { bookingService } = setup(asyncService);
    await expect(bookingService.getByPublicCode("CEL-23456789AB")).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });
  });

  it("CT23 tenta um novo código somente quando há colisão de publicCode", async () => {
    const context = setup(asyncService, false, {
      collisions: 1,
      codes: ["CEL-23456789AB", "CEL-BCDEFGHJKM"],
    });
    const result = await context.bookingService.create(asyncPayload, "collision-key-123");
    expect(context.attempts()).toBe(2);
    expect(result.booking.publicCode).toBe("CEL-BCDEFGHJKM");
  });
});
