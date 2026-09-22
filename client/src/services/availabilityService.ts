import { createMockAvailableDates, createMockAvailableSlots } from "@/mocks/availability";
import { apiClient } from "@/lib/apiClient";
import type { Modality, Reading } from "@/types/domain";
import { usingMockApi } from "@/config/apiMode";

export type AvailableDate = { isoDate: string; date: Date };
export type AvailabilitySlot = { startTime: string };

export interface AvailabilityService {
  getAvailableDates(reading: Reading, modality: Modality | null): Promise<AvailableDate[]>;
  getAvailableSlots(reading: Reading, isoDate: string, modality: Modality | null): Promise<AvailabilitySlot[]>;
}

export class MockAvailabilityService implements AvailabilityService {
  async getAvailableDates(reading: Reading, modality: Modality | null) {
    if (reading.fulfillmentType === "async" || !modality) return [];
    return createMockAvailableDates().map((date) => ({ isoDate: date.toISOString().slice(0, 10), date }));
  }

  async getAvailableSlots(reading: Reading, _isoDate: string, modality: Modality | null) {
    if (!modality) return [];
    return createMockAvailableSlots(reading).map((startTime) => ({ startTime }));
  }
}

type ApiAvailabilityResponse = {
  timezone: string;
  dates: Array<{ date: string; slots: Array<{ startTime: string; available: boolean }> }>;
};

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export class ApiAvailabilityService implements AvailabilityService {
  async getAvailableDates(reading: Reading, modality: Modality | null) {
    if (reading.fulfillmentType === "async" || !modality) return [];
    const from = todayInSaoPaulo();
    const result = await this.fetch(reading.slug, modality, from, addDays(from, 59));
    return result.dates.map(({ date }) => ({ isoDate: date, date: new Date(`${date}T12:00:00`) }));
  }

  async getAvailableSlots(reading: Reading, isoDate: string, modality: Modality | null) {
    if (reading.fulfillmentType === "async" || !modality) return [];
    const result = await this.fetch(reading.slug, modality, isoDate, isoDate);
    return (result.dates.find(({ date }) => date === isoDate)?.slots ?? [])
      .filter(({ available }) => available)
      .map(({ startTime }) => ({ startTime }));
  }

  private fetch(serviceSlug: string, modality: Modality, from: string, to: string) {
    const query = new URLSearchParams({ serviceSlug, modality, from, to });
    return apiClient.request<ApiAvailabilityResponse>(`/availability?${query}`);
  }
}

export { usingMockApi };
export const availabilityService: AvailabilityService = usingMockApi
  ? new MockAvailabilityService()
  : new ApiAvailabilityService();
