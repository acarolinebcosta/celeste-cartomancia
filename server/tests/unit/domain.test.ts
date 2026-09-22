import { describe, expect, it } from "vitest";
import { createPayloadHash } from "../../domain/idempotency.js";
import { createPublicCode } from "../../domain/publicCode.js";
import { dateRange, minutesToTime, parseBusinessDate, toBusinessInstant } from "../../domain/time.js";

describe("domain utilities", () => {
  it("gera código público amigável a partir de entropia criptográfica injetável", () => {
    const code = createPublicCode((size) => Buffer.from(Array.from({ length: size }, (_, index) => index)));
    expect(code).toBe("CEL-23456789AB");
    expect(code).toMatch(/^CEL-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/);
  });

  it("gera o mesmo hash para objetos semanticamente iguais", () => {
    expect(createPayloadHash({ b: 2, a: { d: 4, c: 3 } }))
      .toBe(createPayloadHash({ a: { c: 3, d: 4 }, b: 2 }));
    expect(createPayloadHash({ a: 1 })).not.toBe(createPayloadHash({ a: 2 }));
  });

  it("interpreta data/hora no timezone de negócio e converte para UTC", () => {
    expect(toBusinessInstant("2026-10-06", "09:00", "America/Sao_Paulo").toISOString())
      .toBe("2026-10-06T12:00:00.000Z");
    expect(parseBusinessDate("2026-10-06", "America/Sao_Paulo").weekday).toBe(2);
    expect(minutesToTime(9 * 60 + 5)).toBe("09:05");
  });

  it("limita ranges e rejeita datas ou horários inválidos", () => {
    expect(dateRange("2026-10-01", "2026-10-03", "America/Sao_Paulo")).toHaveLength(3);
    expect(() => dateRange("2026-10-01", "2027-01-01", "America/Sao_Paulo")).toThrow(/60 dias/);
    expect(() => parseBusinessDate("2026-02-30", "America/Sao_Paulo")).toThrow(/Data inválida/);
    expect(() => toBusinessInstant("2026-10-01", "25:00", "America/Sao_Paulo")).toThrow(/Horário inválido/);
  });
});
