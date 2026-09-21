import { describe, expect, it } from "vitest";
import { getReading } from "@/data/readings";
import { emptyBooking, getBookingSteps, initializeBookingFromSearch, isBookingCompatible, selectDate, selectModality, selectReading } from "@/features/booking/bookingState";

describe("estado do booking", () => {
  it("aceita serviço informado por querystring", () => {
    expect(initializeBookingFromSearch("servico=amor-relacoes").booking.readingSlug).toBe("amor-relacoes");
  });

  it("preserva modalidade informada e escolhe leitura compatível", () => {
    const result = initializeBookingFromSearch("modalidade=voice");
    expect(result.booking).toMatchObject({ readingSlug: "entre-caminhos", modality: "voice" });
    expect(result.modalityFilter).toBe("voice");
  });

  it("limpa modalidade de querystring incompatível com leitura explícita", () => {
    const result = initializeBookingFromSearch("servico=pergunta-direta&modalidade=video");
    expect(result.booking.readingSlug).toBe("pergunta-direta");
    expect(result.booking.modality).toBe("message");
    expect(result.modalityFilter).toBeNull();
  });

  it("troca de leitura limpa data e horário e mantém modalidade somente se compatível", () => {
    const current = { ...emptyBooking, readingSlug: "amor-relacoes", modality: "voice" as const, date: "2026-09-22", time: "11:00" };
    expect(selectReading(current, getReading("leitura-profunda"))).toMatchObject({ modality: "voice", date: "", time: "" });
    expect(selectReading(current, getReading("pergunta-direta"))).toMatchObject({ modality: "message", date: "", time: "" });
  });

  it("troca de modalidade limpa data e horário", () => {
    const current = { ...emptyBooking, date: "2026-09-22", time: "11:00" };
    expect(selectModality(current, "video")).toMatchObject({ modality: "video", date: "", time: "" });
  });

  it("troca de data limpa horário", () => {
    expect(selectDate({ ...emptyBooking, time: "11:00" }, "2026-09-23")).toMatchObject({ date: "2026-09-23", time: "" });
  });

  it("gera passos assíncronos sem calendário", () => {
    expect(getBookingSteps(getReading("pergunta-direta"))).toEqual(["reading", "question", "details", "summary", "payment"]);
  });

  it("gera passos agendados com calendário", () => {
    expect(getBookingSteps(getReading("amor-relacoes"))).toEqual(["reading", "modality", "schedule", "details", "summary", "payment"]);
  });

  it("nunca considera estado incompatível como completo", () => {
    const reading = getReading("amor-relacoes");
    expect(isBookingCompatible({ ...emptyBooking, readingSlug: reading.slug, modality: "message", date: "2026-09-22", time: "11:00" }, reading)).toBe(false);
  });
});
