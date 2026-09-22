import { usingMockApi } from "@/config/apiMode";
import { mockReadings } from "@/data/readings";
import { apiClient } from "@/lib/apiClient";
import type { Reading } from "@/types/domain";

export interface ServiceCatalogService {
  listServices(): Promise<Reading[]>;
}

export class MockServiceCatalogService implements ServiceCatalogService {
  async listServices() {
    return mockReadings.map((reading) => ({ ...reading, explores: [...reading.explores] }));
  }
}

export class ApiServiceCatalogService implements ServiceCatalogService {
  constructor(private readonly client: Pick<typeof apiClient, "request"> = apiClient) {}

  async listServices() {
    const services = await this.client.request<Reading[]>("/services");
    return services.filter((service) => service.active);
  }
}

export const serviceCatalogService: ServiceCatalogService = usingMockApi
  ? new MockServiceCatalogService()
  : new ApiServiceCatalogService();
