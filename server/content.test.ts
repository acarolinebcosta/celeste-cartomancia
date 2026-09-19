import { describe, expect, it } from "vitest";
import { formatBRL, getAvailableDates, getAvailableTimes, getReading, readings } from "../client/src/lib/content";
import { createMockBookingPreview } from "../client/src/services/bookingService";

describe("Celeste content contracts", () => {
  it("keeps the commercial catalog typed and priced", () => {
    expect(readings).toHaveLength(5);
    expect(getReading("amor-relacoes").price).toBe(129);
    expect(formatBRL(49)).toContain("49");
  });

  it("returns only future weekdays for the booking mock", () => {
    const dates = getAvailableDates(8);
    expect(dates).toHaveLength(8);
    dates.forEach((date) => {
      expect(date.getTime()).toBeGreaterThan(Date.now() - 86_400_000);
      expect([0, 1]).not.toContain(date.getDay());
    });
  });

  it("adapts available times to the selected reading", () => {
    expect(getAvailableTimes(getReading("pergunta-direta"))).toContain("09:30");
    expect(getAvailableTimes(getReading("leitura-profunda"))).toContain("09:00");
  });

  it("keeps the frontend payment state explicitly pending", () => {
    const preview = createMockBookingPreview({
      readingSlug: "amor-relacoes",
      modality: "video",
      date: "2026-10-15",
      time: "14:30",
      name: "Pessoa de exemplo",
      email: "exemplo@celeste.test",
      whatsapp: "11999999999",
      context: "",
    }, getReading("amor-relacoes"));
    expect(preview.status).toBe("pendente");
    expect(preview.paymentStatus).toBe("aguardando_pagamento");
    expect(preview.publicCode).toMatch(/^CEL-[A-Z0-9]{6}$/);
  });
});
