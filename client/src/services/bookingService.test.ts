import { describe, expect, it } from "vitest";
import { getReading } from "@/data/readings";
import { emptyBooking } from "@/features/booking/bookingState";
import { createMockPublicCode, MockBookingService } from "@/services/bookingService";
import { MockPaymentService } from "@/services/paymentService";

describe("serviços mock", () => {
  it("gera código público no formato demonstrativo", () => {
    expect(createMockPublicCode(() => 0.123456789)).toMatch(/^CEL-[A-Z0-9]{6}$/);
  });

  it("persiste e recupera preview somente na sessionStorage", async () => {
    const service = new MockBookingService();
    const created = await service.createBooking({ reading: getReading("pergunta-direta"), data: emptyBooking, utms: { utm_source: "teste" } });
    await expect(service.getBooking(created.publicCode)).resolves.toEqual(created);
    expect(window.localStorage).toHaveLength(0);
  });

  it("retorna null para código inexistente", async () => {
    await expect(new MockBookingService().getBooking("CEL-XXXXXX")).resolves.toBeNull();
  });

  it("checkout mock permanece aguardando pagamento", async () => {
    await expect(new MockPaymentService().createCheckout("CEL-ABC123", "pix")).resolves.toMatchObject({ mode: "mock", status: "awaiting_payment" });
  });
});
