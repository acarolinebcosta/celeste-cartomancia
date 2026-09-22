import { describe, expect, it } from "vitest";
import { resolveMockApiMode } from "@/config/apiMode";

describe("API mode", () => {
  it("FI06 usa API real quando a variável está ausente ou false", () => {
    expect(resolveMockApiMode(undefined, false)).toBe(false);
    expect(resolveMockApiMode("false", true)).toBe(false);
  });

  it("mantém mock como opt-in explícito apenas fora de produção", () => {
    expect(resolveMockApiMode("true", false)).toBe(true);
    expect(() => resolveMockApiMode("true", true)).toThrow("Mock API cannot be enabled in production");
  });
});
