import { Modality, PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import type { AppConfig } from "../../config/env.js";
import { PrismaBookingRepository } from "../../repositories/prismaBookingRepository.js";
import type { AtomicBookingInput } from "../../repositories/contracts.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const now = new Date("2026-10-01T12:00:00Z");

const scheduledPayload = {
  serviceSlug: "amor-relacoes",
  modality: "video",
  date: "2026-10-02",
  time: "09:00",
  customer: { name: "Ana", email: "ana@example.com", whatsapp: "51999999999" },
  context: "",
  termsAccepted: true,
  utms: {},
};

const asyncPayload = {
  serviceSlug: "pergunta-direta",
  modality: "message",
  question: "Quais movimentos merecem minha atenção agora?",
  customer: { name: "Ana", email: "ana@example.com", whatsapp: "51999999999" },
  context: "",
  termsAccepted: true,
  utms: {},
};

async function seed(prisma: PrismaClient) {
  const direct = await prisma.service.create({
    data: {
      slug: "pergunta-direta",
      name: "Pergunta Direta",
      eyebrow: "Para um ponto específico",
      description: "Descrição",
      audience: "Público",
      explores: ["clareza"],
      fulfillmentType: "ASYNC",
      durationMinutes: null,
      priceCents: 4_900,
      estimatedDelivery: "Prazo informado antes da confirmação.",
      modalities: { create: [{ modality: Modality.MESSAGE }] },
    },
  });
  const scheduled = await prisma.service.create({
    data: {
      slug: "amor-relacoes",
      name: "Amor & Relações",
      eyebrow: "Para vínculos",
      description: "Descrição",
      audience: "Público",
      explores: ["vínculos"],
      fulfillmentType: "SCHEDULED",
      durationMinutes: 30,
      priceCents: 12_900,
      modalities: { create: [{ modality: Modality.VOICE }, { modality: Modality.VIDEO }] },
    },
  });
  const deep = await prisma.service.create({
    data: {
      slug: "leitura-profunda",
      name: "Leitura Profunda",
      eyebrow: "Para olhar com tempo",
      description: "Descrição",
      audience: "Público",
      explores: ["camadas"],
      fulfillmentType: "SCHEDULED",
      durationMinutes: 60,
      priceCents: 17_900,
      modalities: { create: [{ modality: Modality.VOICE }, { modality: Modality.VIDEO }] },
    },
  });
  await prisma.availabilityRule.createMany({
    data: [2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      startMinute: 9 * 60,
      endMinute: 18 * 60,
      bufferMinutes: 15,
      timezone: "America/Sao_Paulo",
    })),
  });
  return { direct, scheduled, deep };
}

describeDatabase("Booking API com PostgreSQL", () => {
  let prisma: PrismaClient;
  let app: FastifyInstance;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    const config: AppConfig = {
      nodeEnv: "test",
      databaseUrl: databaseUrl!,
      port: 3000,
      host: "127.0.0.1",
      frontendOrigin: "http://localhost:5173",
      bookingHoldMinutes: 15,
      businessTimezone: "America/Sao_Paulo",
      termsVersion: "2026-09-draft",
      privacyVersion: "2026-09-draft",
      enableSwagger: false,
    };
    app = await buildApp({ config, prisma, logger: false, clock: () => now });
    await app.ready();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Booking", "AvailabilityBlock", "AvailabilityException", "AvailabilityRule", "ServiceModality", "Service" RESTART IDENTITY CASCADE');
    await seed(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const postBooking = (payload: unknown, key: string) => app.inject({
    method: "POST",
    url: "/api/bookings",
    headers: { "idempotency-key": key },
    payload,
  });

  const atomicScheduledInput = (
    serviceId: string,
    publicCode: string,
    idempotencyKey: string,
    scheduledStart: Date,
    scheduledEnd: Date,
  ): AtomicBookingInput => ({
    publicCode,
    serviceId,
    fulfillmentType: "SCHEDULED",
    modality: "VIDEO",
    customerName: "Integration Test",
    customerEmail: "integration@example.com",
    customerWhatsapp: "51999999999",
    question: null,
    context: null,
    scheduledStart,
    scheduledEnd,
    timezone: "America/Sao_Paulo",
    priceCents: 12_900,
    expiresAt: new Date("2026-10-01T12:15:00Z"),
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    termsVersion: "2026-09-draft",
    privacyVersion: "2026-09-draft",
    termsAcceptedAt: now,
    idempotencyKey,
    idempotencyHash: `hash-${idempotencyKey}`,
    reservation: { lockDate: "2026-10-02", bufferMinutes: 15 },
  });

  it("expõe healthcheck e somente serviços ativos com preço em centavos", async () => {
    const health = await app.inject({ method: "GET", url: "/api/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok", database: "ok" });
    expect(health.headers["x-request-id"]).toBeTruthy();

    const response = await app.inject({ method: "GET", url: "/api/services" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: "pergunta-direta", priceCents: 4_900, fulfillmentType: "async", availableModalities: ["message"] }),
      expect.objectContaining({ slug: "amor-relacoes", priceCents: 12_900, fulfillmentType: "scheduled" }),
    ]));

    await prisma.service.update({ where: { slug: "pergunta-direta" }, data: { active: false } });
    const activeOnly = await app.inject({ method: "GET", url: "/api/services" });
    expect(activeOnly.json().map((service: { slug: string }) => service.slug)).not.toContain("pergunta-direta");
  });

  it("CT01 cria scheduled válido como PENDING_PAYMENT", async () => {
    const response = await postBooking(scheduledPayload, "ct01-scheduled");
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      service: { slug: "amor-relacoes" },
      fulfillmentType: "SCHEDULED",
      modality: "VIDEO",
      status: "PENDING_PAYMENT",
      paymentStatus: "AWAITING_PAYMENT",
      priceCents: 12_900,
      scheduledStart: "2026-10-02T12:00:00.000Z",
      expiresAt: "2026-10-01T12:15:00.000Z",
    });
  });

  it("CT02/CT18 cria async sem slot e com UTM opcional", async () => {
    const response = await postBooking(asyncPayload, "ct02-async-key");
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      fulfillmentType: "ASYNC",
      modality: "MESSAGE",
      status: "PENDING_PAYMENT",
      scheduledStart: null,
      expiresAt: null,
      priceCents: 4_900,
    });
  });

  it("CT03/CT04 rejeita shape incompatível com fulfillment", async () => {
    const asyncWithDate = await postBooking({ ...asyncPayload, date: "2026-10-02", time: "09:00" }, "ct03-async-date");
    expect(asyncWithDate.statusCode).toBe(422);
    expect(asyncWithDate.json().error.code).toBe("INVALID_FULFILLMENT");

    const withoutSlot = {
      serviceSlug: scheduledPayload.serviceSlug,
      modality: scheduledPayload.modality,
      customer: scheduledPayload.customer,
      context: scheduledPayload.context,
      termsAccepted: scheduledPayload.termsAccepted,
      utms: scheduledPayload.utms,
    };
    const scheduledWithoutSlot = await postBooking(withoutSlot, "ct04-no-slot");
    expect(scheduledWithoutSlot.statusCode).toBe(422);
    expect(scheduledWithoutSlot.json().error.code).toBe("INVALID_FULFILLMENT");
  });

  it("CT05 rejeita modalidade incompatível", async () => {
    const response = await postBooking({ ...scheduledPayload, modality: "message" }, "ct05-modality");
    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe("INVALID_MODALITY");
  });

  it("CT06 rejeita preço manipulado e mantém autoridade no banco", async () => {
    const manipulated = await postBooking({ ...scheduledPayload, priceCents: 1 }, "ct06-price-bad");
    expect(manipulated.statusCode).toBe(400);
    expect(manipulated.json().error.code).toBe("VALIDATION_ERROR");

    const valid = await postBooking(scheduledPayload, "ct06-price-good");
    expect(valid.json().priceCents).toBe(12_900);
  });

  it("CT07 rejeita slot que não foi gerado", async () => {
    const response = await postBooking({ ...scheduledPayload, time: "09:30" }, "ct07-slot");
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("SLOT_UNAVAILABLE");
  });

  it("CT08 bloqueia segundo booking para o mesmo slot", async () => {
    expect((await postBooking(scheduledPayload, "ct08-first")).statusCode).toBe(201);
    const second = await postBooking(scheduledPayload, "ct08-second");
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe("SLOT_UNAVAILABLE");
  });

  it("CT09 serializa duas requisições concorrentes para o mesmo slot", async () => {
    const responses = await Promise.all([
      postBooking(scheduledPayload, "ct09-concurrent-a"),
      postBooking(scheduledPayload, "ct09-concurrent-b"),
    ]);
    expect(responses.map(({ statusCode }) => statusCode).sort()).toEqual([201, 409]);
    expect(await prisma.booking.count({ where: { status: "PENDING_PAYMENT" } })).toBe(1);
  });

  it("CT10 pending expirado libera o slot", async () => {
    expect((await postBooking(scheduledPayload, "ct10-expired")).statusCode).toBe(201);
    await prisma.booking.updateMany({ data: { expiresAt: new Date("2026-10-01T11:59:00Z") } });
    const response = await app.inject({ method: "GET", url: "/api/availability?serviceSlug=amor-relacoes&modality=video&from=2026-10-02&to=2026-10-02" });
    expect(response.statusCode).toBe(200);
    expect(response.json().dates[0].slots).toContainEqual({ startTime: "09:00", available: true });
    expect(await prisma.booking.findFirst()).toMatchObject({ status: "EXPIRED", paymentStatus: "EXPIRED" });
  });

  it("CT11 pending válido mantém o slot bloqueado", async () => {
    expect((await postBooking(scheduledPayload, "ct11-valid-hold")).statusCode).toBe(201);
    const response = await app.inject({ method: "GET", url: "/api/availability?serviceSlug=amor-relacoes&modality=video&from=2026-10-02&to=2026-10-02" });
    expect(response.json().dates[0].slots).not.toContainEqual({ startTime: "09:00", available: true });
  });

  it("CT12 repete a mesma operação sem duplicar booking", async () => {
    const [first, second] = await Promise.all([
      postBooking(scheduledPayload, "ct12-same-key"),
      postBooking(scheduledPayload, "ct12-same-key"),
    ]);
    expect([first.statusCode, second.statusCode].sort()).toEqual([200, 201]);
    expect([first.headers["idempotency-replayed"], second.headers["idempotency-replayed"]]).toContain("true");
    expect(second.json().publicCode).toBe(first.json().publicCode);
    expect(await prisma.booking.count()).toBe(1);
  });

  it("CT13 rejeita chave idempotente reutilizada com payload diferente", async () => {
    expect((await postBooking(asyncPayload, "ct13-conflict-key")).statusCode).toBe(201);
    const response = await postBooking({ ...asyncPayload, question: "Uma pergunta diferente e suficientemente longa." }, "ct13-conflict-key");
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("CT14/CT25 consulta por código sem expor ID, PII ou campos técnicos", async () => {
    const created = await postBooking(asyncPayload, "ct14-public-code");
    const response = await app.inject({ method: "GET", url: `/api/bookings/${created.json().publicCode}` });
    expect(response.statusCode).toBe(200);
    for (const field of [
      "id",
      "serviceId",
      "customerName",
      "customerEmail",
      "customerWhatsapp",
      "question",
      "context",
      "idempotencyKey",
      "idempotencyHash",
    ]) expect(response.json()).not.toHaveProperty(field);
  });

  it("CT15/CT16 rejeita serviço inexistente e inativo", async () => {
    const missing = await postBooking({ ...asyncPayload, serviceSlug: "inexistente" }, "ct15-missing");
    expect(missing.statusCode).toBe(404);
    expect(missing.json().error.code).toBe("SERVICE_NOT_FOUND");

    await prisma.service.update({ where: { slug: "pergunta-direta" }, data: { active: false } });
    const inactive = await postBooking(asyncPayload, "ct16-inactive");
    expect(inactive.statusCode).toBe(422);
    expect(inactive.json().error.code).toBe("SERVICE_INACTIVE");
  });

  it("CT17 rejeita termos não aceitos", async () => {
    const response = await postBooking({ ...asyncPayload, termsAccepted: false }, "ct17-terms");
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("retorna disponibilidade e rejeita agenda para async", async () => {
    const scheduled = await app.inject({ method: "GET", url: "/api/availability?serviceSlug=amor-relacoes&modality=video&from=2026-10-02&to=2026-10-02" });
    expect(scheduled.statusCode).toBe(200);
    expect(scheduled.json()).toMatchObject({ timezone: "America/Sao_Paulo", fulfillmentType: "SCHEDULED" });

    const asyncResponse = await app.inject({ method: "GET", url: "/api/availability?serviceSlug=pergunta-direta&modality=message&from=2026-10-02&to=2026-10-02" });
    expect(asyncResponse.statusCode).toBe(422);
    expect(asyncResponse.json().error.code).toBe("INVALID_FULFILLMENT");
  });

  it("retorna BOOKING_NOT_FOUND para código público ausente", async () => {
    const response = await app.inject({ method: "GET", url: "/api/bookings/CEL-23456789AB" });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("BOOKING_NOT_FOUND");
  });

  it("CT19 bloqueia overlap real entre sessões de 60 e 30 minutos", async () => {
    const deepPayload = {
      ...scheduledPayload,
      serviceSlug: "leitura-profunda",
      time: "09:00",
    };
    const shortPayload = { ...scheduledPayload, time: "09:45" };
    const responses = await Promise.all([
      postBooking(deepPayload, "ct19-deep-session"),
      postBooking(shortPayload, "ct19-short-session"),
    ]);
    expect(responses.map(({ statusCode }) => statusCode).sort()).toEqual([201, 409]);
    expect(responses.find(({ statusCode }) => statusCode === 409)?.json().error.code).toBe("SLOT_UNAVAILABLE");
    expect(await prisma.booking.count({ where: { status: "PENDING_PAYMENT" } })).toBe(1);
  });

  it("CT20 rejeita overlap dentro do buffer na proteção transacional", async () => {
    expect((await postBooking(scheduledPayload, "ct20-first")).statusCode).toBe(201);
    const service = await prisma.service.findUniqueOrThrow({ where: { slug: "amor-relacoes" } });
    const repository = new PrismaBookingRepository(prisma);
    await expect(repository.createAtomic(atomicScheduledInput(
      service.id,
      "CEL-CT20BUFFER",
      "ct20-buffer-zone",
      new Date("2026-10-02T12:40:00Z"),
      new Date("2026-10-02T13:10:00Z"),
    ), now)).rejects.toMatchObject({ code: "SLOT_UNAVAILABLE" });
  });

  it("CT21 aceita reserva exatamente fora da zona de buffer", async () => {
    expect((await postBooking(scheduledPayload, "ct21-first")).statusCode).toBe(201);
    const service = await prisma.service.findUniqueOrThrow({ where: { slug: "amor-relacoes" } });
    const repository = new PrismaBookingRepository(prisma);
    await expect(repository.createAtomic(atomicScheduledInput(
      service.id,
      "CEL-CT21OUTSID",
      "ct21-outside-buffer",
      new Date("2026-10-02T12:45:00Z"),
      new Date("2026-10-02T13:15:00Z"),
    ), now)).resolves.toMatchObject({ replayed: false });
    expect(await prisma.booking.count({ where: { status: "PENDING_PAYMENT" } })).toBe(2);
  });

  it("impede exceções de disponibilidade com janela parcial ou inválida", async () => {
    await expect(prisma.availabilityException.create({
      data: { date: new Date("2026-10-03T00:00:00Z"), available: true, startMinute: 540, endMinute: null, timezone: "America/Sao_Paulo" },
    })).rejects.toBeTruthy();
    await expect(prisma.availabilityException.create({
      data: { date: new Date("2026-10-03T00:00:00Z"), available: true, startMinute: 900, endMinute: 800, timezone: "America/Sao_Paulo" },
    })).rejects.toBeTruthy();
  });
});
