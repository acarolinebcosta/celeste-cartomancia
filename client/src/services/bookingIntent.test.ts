import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "@/lib/apiClient";
import { getReading } from "@/data/readings";
import { emptyBooking } from "@/features/booking/bookingState";
import { ApiBookingService } from "@/services/bookingService";
import { BOOKING_INTENT_STORAGE_KEY, BookingIntentStore } from "@/services/bookingIntent";

const apiBooking = {
  publicCode: "CEL-23456789AB",
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
};

const asyncInput = {
  reading: getReading("pergunta-direta"),
  data: {
    ...emptyBooking,
    question: "Quais movimentos merecem minha atenção?",
    name: "Ana",
    email: "ana@example.com",
    whatsapp: "51999999999",
    termsAccepted: true,
  },
  utms: {},
};

function successResponse() {
  return new Response(JSON.stringify(apiBooking), { status: 201 });
}

describe("booking intent idempotency", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("FI01 duas chamadas simultâneas da mesma intenção reutilizam a chave", async () => {
    const keys = ["intent-key-a", "intent-key-b"];
    const fetchMock = vi.fn().mockImplementation(async () => successResponse());
    vi.stubGlobal("fetch", fetchMock);
    const service = new ApiBookingService(new ApiClient("http://api.test"), new BookingIntentStore(sessionStorage, () => keys.shift()!));
    await Promise.all([service.createBooking(asyncInput), service.createBooking(asyncInput)]);
    expect(fetchMock.mock.calls.map(([, options]) => (options?.headers as Record<string, string>)["Idempotency-Key"]))
      .toEqual(["intent-key-a", "intent-key-a"]);
  });

  it("FI02/FI06 falha de rede preserva a chave no retry async", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(successResponse());
    vi.stubGlobal("fetch", fetchMock);
    const service = new ApiBookingService(new ApiClient("http://api.test"), new BookingIntentStore(sessionStorage, () => "stable-async-key"));
    await expect(service.createBooking(asyncInput)).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    await expect(service.createBooking(asyncInput)).resolves.toMatchObject({ publicCode: apiBooking.publicCode });
    expect(fetchMock.mock.calls.map(([, options]) => (options?.headers as Record<string, string>)["Idempotency-Key"]))
      .toEqual(["stable-async-key", "stable-async-key"]);
  });

  it("FI03 alterar slot gera uma nova chave", () => {
    const keys = ["slot-key-a", "slot-key-b"];
    const store = new BookingIntentStore(sessionStorage, () => keys.shift()!);
    expect(store.getOrCreate({ serviceSlug: "amor-relacoes", date: "2026-10-02", time: "14:30" }).key).toBe("slot-key-a");
    expect(store.getOrCreate({ serviceSlug: "amor-relacoes", date: "2026-10-02", time: "16:00" }).key).toBe("slot-key-b");
  });

  it("FI04 alterar serviço gera uma nova chave", () => {
    const keys = ["service-key-a", "service-key-b"];
    const store = new BookingIntentStore(sessionStorage, () => keys.shift()!);
    expect(store.getOrCreate({ serviceSlug: "amor-relacoes" }).key).toBe("service-key-a");
    expect(store.getOrCreate({ serviceSlug: "leitura-profunda" }).key).toBe("service-key-b");
  });

  it("FI05 sucesso descarta a intenção persistida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successResponse()));
    const service = new ApiBookingService(new ApiClient("http://api.test"), new BookingIntentStore(sessionStorage, () => "success-key"));
    await service.createBooking(asyncInput);
    expect(sessionStorage.getItem(BOOKING_INTENT_STORAGE_KEY)).toBeNull();
  });
});
