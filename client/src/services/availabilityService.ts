import { createMockAvailableDates, createMockAvailableSlots } from "@/mocks/availability";
import type { Reading } from "@/types/domain";

export type AvailableDate = { isoDate: string; date: Date };
export type AvailabilitySlot = { startTime: string };

export interface AvailabilityService {
  getAvailableDates(reading: Reading): Promise<AvailableDate[]>;
  getAvailableSlots(reading: Reading, isoDate: string): Promise<AvailabilitySlot[]>;
}

export class MockAvailabilityService implements AvailabilityService {
  async getAvailableDates(reading: Reading) {
    if (reading.fulfillmentType === "async") return [];
    return createMockAvailableDates().map((date) => ({ isoDate: date.toISOString().slice(0, 10), date }));
  }

  async getAvailableSlots(reading: Reading, _isoDate: string) {
    return createMockAvailableSlots(reading).map((startTime) => ({ startTime }));
  }
}

export const availabilityService: AvailabilityService = new MockAvailabilityService();
