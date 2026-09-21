import type { PrismaClient } from "@prisma/client";
import type { ServiceRecord } from "../domain/types.js";
import type { ServiceRepository } from "./contracts.js";

type ServiceRow = Awaited<ReturnType<PrismaClient["service"]["findFirst"]>> & {
  modalities?: Array<{ modality: "MESSAGE" | "VOICE" | "VIDEO" }>;
};

function mapService(row: NonNullable<ServiceRow>): ServiceRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    eyebrow: row.eyebrow,
    description: row.description,
    audience: row.audience,
    explores: row.explores,
    fulfillmentType: row.fulfillmentType,
    durationMinutes: row.durationMinutes,
    priceCents: row.priceCents,
    featured: row.featured,
    estimatedDelivery: row.estimatedDelivery,
    active: row.active,
    modalities: row.modalities?.map(({ modality }) => modality) ?? [],
  };
}

export class PrismaServiceRepository implements ServiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listActive() {
    const rows = await this.prisma.service.findMany({
      where: { active: true },
      include: { modalities: { orderBy: { modality: "asc" } } },
      orderBy: { priceCents: "asc" },
    });
    return rows.map(mapService);
  }

  async findBySlug(slug: string) {
    const row = await this.prisma.service.findUnique({
      where: { slug },
      include: { modalities: { orderBy: { modality: "asc" } } },
    });
    return row ? mapService(row) : null;
  }
}
