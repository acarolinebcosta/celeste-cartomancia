import type { AvailabilityExceptionRecord, AvailabilityRuleRecord, BookingRecord, ServiceRecord, TimeRange } from "../domain/types.js";

export interface ServiceRepository {
  listActive(): Promise<ServiceRecord[]>;
  findBySlug(slug: string): Promise<ServiceRecord | null>;
}

export interface AvailabilityRepository {
  expireStaleBookings(now: Date): Promise<void>;
  listRules(timezone: string): Promise<AvailabilityRuleRecord[]>;
  listExceptions(from: Date, to: Date, timezone: string): Promise<AvailabilityExceptionRecord[]>;
  listBlocks(from: Date, to: Date): Promise<TimeRange[]>;
  listBlockingBookings(from: Date, to: Date, now: Date): Promise<TimeRange[]>;
}

export type AtomicBookingInput = {
  publicCode: string;
  serviceId: string;
  fulfillmentType: "ASYNC" | "SCHEDULED";
  modality: "MESSAGE" | "VOICE" | "VIDEO";
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  question: string | null;
  context: string | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  timezone: string;
  priceCents: number;
  expiresAt: Date | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  termsVersion: string;
  privacyVersion: string;
  termsAcceptedAt: Date;
  idempotencyKey: string;
  idempotencyHash: string;
  reservation?: {
    lockDate: string;
    bufferMinutes: number;
  };
};

export type AtomicBookingResult = { booking: BookingRecord; replayed: boolean };

export interface BookingRepository {
  createAtomic(input: AtomicBookingInput, now: Date): Promise<AtomicBookingResult>;
  findByPublicCode(publicCode: string, now: Date): Promise<BookingRecord | null>;
}
