import { describe, expect, it, vi } from "vitest";
import { ApiServiceCatalogService, MockServiceCatalogService } from "@/services/serviceCatalogService";
import type { Reading } from "@/types/domain";

const apiReading: Reading = {
  slug: "amor-relacoes",
  name: "Amor & Relações",
  eyebrow: "Para vínculos",
  description: "Descrição da API",
  audience: "Público",
  explores: ["vínculos"],
  fulfillmentType: "scheduled",
  durationMinutes: 30,
  priceCents: 14_900,
  active: true,
  availableModalities: ["voice", "video"],
};

describe("ServiceCatalogService", () => {
  it("SC01/SC02 mapeia o contrato da API preservando priceCents", async () => {
    const request = vi.fn().mockResolvedValue([apiReading]);
    const result = await new ApiServiceCatalogService({ request } as never).listServices();
    expect(request).toHaveBeenCalledWith("/services");
    expect(result).toEqual([expect.objectContaining({ slug: "amor-relacoes", priceCents: 14_900 })]);
  });

  it("SC03 remove qualquer serviço inativo por defesa em profundidade", async () => {
    const request = vi.fn().mockResolvedValue([apiReading, { ...apiReading, slug: "inativo", active: false }]);
    const result = await new ApiServiceCatalogService({ request } as never).listServices();
    expect(result.map(({ slug }) => slug)).toEqual(["amor-relacoes"]);
  });

  it("SC04 não substitui o preço da API por preço local obsoleto", async () => {
    const request = vi.fn().mockResolvedValue([{ ...apiReading, priceCents: 15_900 }]);
    await expect(new ApiServiceCatalogService({ request } as never).listServices())
      .resolves.toEqual([expect.objectContaining({ priceCents: 15_900 })]);
  });

  it("SC05 propaga erro de API sem fallback silencioso", async () => {
    const request = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(new ApiServiceCatalogService({ request } as never).listServices()).rejects.toThrow("offline");
  });

  it("mantém catálogo mock no mesmo contrato", async () => {
    const result = await new MockServiceCatalogService().listServices();
    expect(result).toHaveLength(5);
    expect(result.every(({ priceCents, active }) => Number.isInteger(priceCents) && active)).toBe(true);
  });
});
