import { describe, expect, it } from "vitest";
import { formatModalities } from "@/data/modalities";
import { readings } from "@/data/readings";
import { formatBRL, formatPriceFrom, formatReadingDuration } from "@/utils/formatters";

describe("catálogo de leituras", () => {
  it("mantém slugs únicos e preços numéricos positivos", () => {
    expect(new Set(readings.map(({ slug }) => slug)).size).toBe(readings.length);
    expect(readings.every(({ priceCents }) => Number.isInteger(priceCents) && priceCents > 0)).toBe(true);
  });

  it("modela Pergunta Direta como assíncrona e somente por mensagem", () => {
    const direct = readings.find(({ slug }) => slug === "pergunta-direta");
    expect(direct).toMatchObject({ fulfillmentType: "async", durationMinutes: null, availableModalities: ["message"] });
    expect(formatReadingDuration(direct!)).toBe("Leitura assíncrona");
  });

  it("modela consultas ao vivo com duração e modalidades compatíveis", () => {
    const scheduled = readings.filter(({ fulfillmentType }) => fulfillmentType === "scheduled");
    expect(scheduled).toHaveLength(4);
    expect(scheduled.every(({ durationMinutes }) => durationMinutes === 30 || durationMinutes === 60)).toBe(true);
    expect(scheduled.every(({ availableModalities }) => availableModalities.includes("voice") && availableModalities.includes("video"))).toBe(true);
  });

  it("deriva preço e modalidades sem fontes duplicadas", () => {
    expect(formatBRL(12_900)).toBe("R$ 129");
    expect(formatPriceFrom(12_900)).toBe("A partir de R$ 129");
    expect(formatModalities(["voice", "video"])).toBe("Chamada de voz ou Videochamada");
  });
});
