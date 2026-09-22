import { describe, expect, it } from "vitest";
import type { ServiceRecord } from "../../domain/types.js";
import type { ServiceRepository } from "../../repositories/contracts.js";
import { ServiceCatalogService } from "../../services/serviceCatalogService.js";

const service: ServiceRecord = {
  id: "service-id",
  slug: "amor-relacoes",
  name: "Amor & Relações",
  eyebrow: "Para vínculos",
  description: "Descrição",
  audience: "Público",
  explores: ["vínculos"],
  fulfillmentType: "SCHEDULED",
  durationMinutes: 30,
  priceCents: 12_900,
  featured: true,
  estimatedDelivery: null,
  active: true,
  modalities: ["VOICE", "VIDEO"],
};

function repository(current: ServiceRecord | null): ServiceRepository {
  return { listActive: async () => current ? [current] : [], findBySlug: async () => current };
}

describe("ServiceCatalogService", () => {
  it("publica DTO em formato frontend com preço em centavos", async () => {
    await expect(new ServiceCatalogService(repository(service)).listActive()).resolves.toEqual([expect.objectContaining({
      slug: "amor-relacoes",
      fulfillmentType: "scheduled",
      priceCents: 12_900,
      availableModalities: ["voice", "video"],
    })]);
  });

  it("distingue serviço inexistente e inativo", async () => {
    await expect(new ServiceCatalogService(repository(null)).requireService("x")).rejects.toMatchObject({ code: "SERVICE_NOT_FOUND" });
    await expect(new ServiceCatalogService(repository({ ...service, active: false })).requireService(service.slug)).rejects.toMatchObject({ code: "SERVICE_INACTIVE" });
  });
});
