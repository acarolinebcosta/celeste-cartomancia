import { describe, expect, it } from "vitest";
import type { AvailabilityExceptionRecord, AvailabilityRuleRecord, ServiceRecord, TimeRange } from "../../domain/types.js";
import type { AvailabilityRepository, ServiceRepository } from "../../repositories/contracts.js";
import { AvailabilityService } from "../../services/availabilityService.js";
import { ServiceCatalogService } from "../../services/serviceCatalogService.js";

const scheduled: ServiceRecord = {
  id: "service-id",
  slug: "amor-relacoes",
  name: "Amor & Relações",
  eyebrow: "",
  description: "",
  audience: "",
  explores: [],
  fulfillmentType: "SCHEDULED",
  durationMinutes: 30,
  priceCents: 12_900,
  featured: false,
  estimatedDelivery: null,
  active: true,
  modalities: ["VOICE", "VIDEO"],
};

const rules: AvailabilityRuleRecord[] = [{ dayOfWeek: 5, startMinute: 540, endMinute: 720, bufferMinutes: 15 }];

function makeService(options: { service?: ServiceRecord; rules?: AvailabilityRuleRecord[]; exceptions?: AvailabilityExceptionRecord[]; blocks?: TimeRange[]; bookings?: TimeRange[] } = {}) {
  const current = options.service ?? scheduled;
  const serviceRepo: ServiceRepository = { listActive: async () => [current], findBySlug: async () => current };
  const availabilityRepo: AvailabilityRepository = {
    expireStaleBookings: async () => undefined,
    listRules: async () => options.rules ?? rules,
    listExceptions: async () => options.exceptions ?? [],
    listBlocks: async () => options.blocks ?? [],
    listBlockingBookings: async () => options.bookings ?? [],
  };
  return new AvailabilityService(new ServiceCatalogService(serviceRepo), availabilityRepo, "America/Sao_Paulo", () => new Date("2026-10-01T12:00:00Z"));
}

describe("AvailabilityService", () => {
  it("gera slots considerando duração e buffer", async () => {
    const result = await makeService().getAvailability({ serviceSlug: scheduled.slug, modality: "VIDEO", from: "2026-10-02", to: "2026-10-02" });
    expect(result.dates[0].slots.map(({ startTime }) => startTime)).toEqual(["09:00", "09:45", "10:30", "11:15"]);
  });

  it("remove bloqueios, bookings e datas integralmente bloqueadas", async () => {
    const block = { startsAt: new Date("2026-10-02T12:45:00Z"), endsAt: new Date("2026-10-02T13:15:00Z") };
    const booking = { startsAt: new Date("2026-10-02T13:30:00Z"), endsAt: new Date("2026-10-02T14:00:00Z") };
    const result = await makeService({ blocks: [block], bookings: [booking] }).getAvailability({ serviceSlug: scheduled.slug, modality: "VOICE", from: "2026-10-02", to: "2026-10-02" });
    expect(result.dates[0].slots.map(({ startTime }) => startTime)).toEqual(["09:00", "11:15"]);

    const blocked = await makeService({ exceptions: [{ date: "2026-10-02", available: false, startMinute: null, endMinute: null }] })
      .getAvailability({ serviceSlug: scheduled.slug, modality: "VOICE", from: "2026-10-02", to: "2026-10-02" });
    expect(blocked.dates).toEqual([]);
  });

  it("usa exceção disponível como janela substituta", async () => {
    const result = await makeService({ exceptions: [{ date: "2026-10-02", available: true, startMinute: 840, endMinute: 930 }] })
      .getAvailability({ serviceSlug: scheduled.slug, modality: "VOICE", from: "2026-10-02", to: "2026-10-02" });
    expect(result.dates[0].slots.map(({ startTime }) => startTime)).toEqual(["14:00", "14:45"]);
  });

  it("rejeita async, modalidade incompatível e slot inexistente", async () => {
    await expect(makeService({ service: { ...scheduled, fulfillmentType: "ASYNC", durationMinutes: null, modalities: ["MESSAGE"] } })
      .getAvailability({ serviceSlug: scheduled.slug, modality: "MESSAGE", from: "2026-10-02", to: "2026-10-02" }))
      .rejects.toMatchObject({ code: "INVALID_FULFILLMENT" });
    await expect(makeService().getAvailability({ serviceSlug: scheduled.slug, modality: "MESSAGE", from: "2026-10-02", to: "2026-10-02" }))
      .rejects.toMatchObject({ code: "INVALID_MODALITY" });
    await expect(makeService().assertSlotAvailable({ serviceSlug: scheduled.slug, modality: "VOICE", date: "2026-10-02", time: "09:30" }))
      .rejects.toMatchObject({ code: "SLOT_UNAVAILABLE" });
  });

  it("retorna os instantes UTC do slot válido", async () => {
    await expect(makeService().assertSlotAvailable({ serviceSlug: scheduled.slug, modality: "VOICE", date: "2026-10-02", time: "09:00" }))
      .resolves.toMatchObject({
        startsAt: new Date("2026-10-02T12:00:00Z"),
        endsAt: new Date("2026-10-02T12:30:00Z"),
        bufferMinutes: 15,
      });
  });

  it("CT22 usa o buffer da janela que originou o slot", async () => {
    const service = makeService({
      rules: [
        { dayOfWeek: 5, startMinute: 540, endMinute: 720, bufferMinutes: 15 },
        { dayOfWeek: 5, startMinute: 840, endMinute: 1080, bufferMinutes: 30 },
      ],
    });
    await expect(service.assertSlotAvailable({
      serviceSlug: scheduled.slug,
      modality: "VOICE",
      date: "2026-10-02",
      time: "14:00",
    })).resolves.toMatchObject({ bufferMinutes: 30 });
  });
});
