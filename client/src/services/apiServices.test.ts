import { afterEach, describe, expect, it, vi } from "vitest";
import { getReading } from "@/data/readings";
import { emptyBooking } from "@/features/booking/bookingState";
import { ApiAvailabilityService } from "@/services/availabilityService";
import { ApiBookingService } from "@/services/bookingService";

describe("API service adapters", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("adapta disponibilidade HTTP para datas e slots da UI", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({
      timezone: "America/Sao_Paulo",
      dates: [{ date: "2026-10-02", slots: [{ startTime: "09:00", available: true }] }],
    }), { status: 200 })));
    const service = new ApiAvailabilityService();
    const reading = getReading("amor-relacoes");
    await expect(service.getAvailableDates(reading, "video")).resolves.toEqual([
      expect.objectContaining({ isoDate: "2026-10-02" }),
    ]);
    await expect(service.getAvailableSlots(reading, "2026-10-02", "video")).resolves.toEqual([{ startTime: "09:00" }]);
  });

  it("cria booking sem enviar preço e normaliza enums da API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      publicCode: "CEL-234567",
      service: { slug: "pergunta-direta", name: "Pergunta Direta", durationMinutes: null },
      status: "PENDING_PAYMENT",
      paymentStatus: "AWAITING_PAYMENT",
      fulfillmentType: "ASYNC",
      modality: "MESSAGE",
      scheduledStart: null,
      timezone: "America/Sao_Paulo",
      priceCents: 4900,
      currency: "BRL",
      expiresAt: null,
      createdAt: "2026-10-01T12:00:00.000Z",
    }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "11111111-1111-4111-8111-111111111111" });

    const booking = await new ApiBookingService().createBooking({
      reading: getReading("pergunta-direta"),
      data: { ...emptyBooking, question: "Quais movimentos merecem minha atenção?", name: "Ana", email: "ana@example.com", whatsapp: "51999999999", termsAccepted: true },
      utms: {},
    });
    expect(booking).toMatchObject({ status: "pending_payment", fulfillmentType: "async", modality: "message", priceCents: 4900 });
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(request.body as string);
    expect(body).not.toHaveProperty("price");
    expect(body).not.toHaveProperty("priceCents");
    expect(request.headers).toMatchObject({ "Idempotency-Key": "11111111-1111-4111-8111-111111111111" });
  });
});
