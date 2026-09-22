import { describe, expect, it } from "vitest";
import { getReading } from "@/data/readings";
import { createMockAvailableDates, createMockAvailableSlots } from "@/mocks/availability";
import { MockAvailabilityService } from "@/services/availabilityService";

describe("disponibilidade mock", () => {
  it("não cria horários para leitura assíncrona", () => {
    expect(createMockAvailableSlots(getReading("pergunta-direta"))).toEqual([]);
  });

  it("usa slots distintos para 30 e 60 minutos", () => {
    expect(createMockAvailableSlots(getReading("amor-relacoes"))).toContain("18:00");
    expect(createMockAvailableSlots(getReading("leitura-profunda"))).toEqual(["09:00", "11:00", "14:00", "16:00"]);
  });

  it("exclui domingos e segundas das datas demonstrativas", () => {
    const dates = createMockAvailableDates(15, new Date(2026, 8, 18));
    expect(dates).toHaveLength(15);
    expect(dates.every((date) => date.getDay() !== 0 && date.getDay() !== 1)).toBe(true);
  });

  it("serviço retorna zero datas para async", async () => {
    await expect(new MockAvailabilityService().getAvailableDates(getReading("pergunta-direta"), "message")).resolves.toEqual([]);
  });
});
