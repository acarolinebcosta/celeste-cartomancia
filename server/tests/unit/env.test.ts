import { describe, expect, it } from "vitest";
import { loadConfig } from "../../config/env.js";

const baseEnvironment = {
  DATABASE_URL: "postgresql://celeste:celeste@localhost:5432/celeste",
};

describe("backend environment", () => {
  it("CT24 aceita um timezone IANA válido", () => {
    expect(loadConfig({ ...baseEnvironment, BUSINESS_TIMEZONE: "America/Sao_Paulo" }).businessTimezone)
      .toBe("America/Sao_Paulo");
  });

  it("CT24 rejeita timezone inválido no startup", () => {
    expect(() => loadConfig({ ...baseEnvironment, BUSINESS_TIMEZONE: "Amerika/SaoPaolo" })).toThrow();
  });
});
