import { errors } from "../errors/appError.js";
import type { ServiceRepository } from "../repositories/contracts.js";

const lower = <Value extends string>(value: Value) => value.toLowerCase() as Lowercase<Value>;

export class ServiceCatalogService {
  constructor(private readonly services: ServiceRepository) {}

  async listActive() {
    const services = await this.services.listActive();
    return services.map((service) => ({
      slug: service.slug,
      name: service.name,
      eyebrow: service.eyebrow,
      description: service.description,
      audience: service.audience,
      explores: service.explores,
      fulfillmentType: lower(service.fulfillmentType),
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      featured: service.featured || undefined,
      availableModalities: service.modalities.map(lower),
      estimatedDelivery: service.estimatedDelivery ?? undefined,
    }));
  }

  async requireService(slug: string) {
    const service = await this.services.findBySlug(slug);
    if (!service) throw errors.serviceNotFound();
    if (!service.active) throw errors.serviceInactive();
    return service;
  }
}
