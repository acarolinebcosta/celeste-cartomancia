export type DomainModality = "MESSAGE" | "VOICE" | "VIDEO";
export type DomainFulfillment = "ASYNC" | "SCHEDULED";
export type DomainBookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
export type DomainPaymentStatus = "AWAITING_PAYMENT" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED" | "REFUNDED";

export type ServiceRecord = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  audience: string;
  explores: string[];
  fulfillmentType: DomainFulfillment;
  durationMinutes: number | null;
  priceCents: number;
  featured: boolean;
  estimatedDelivery: string | null;
  active: boolean;
  modalities: DomainModality[];
};

export type AvailabilityRuleRecord = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  bufferMinutes: number;
};

export type AvailabilityExceptionRecord = {
  date: string;
  available: boolean;
  startMinute: number | null;
  endMinute: number | null;
};

export type TimeRange = { startsAt: Date; endsAt: Date };

export type BookingRecord = {
  id: string;
  publicCode: string;
  service: Pick<ServiceRecord, "slug" | "name" | "durationMinutes">;
  fulfillmentType: DomainFulfillment;
  modality: DomainModality | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  timezone: string;
  priceCents: number;
  currency: string;
  status: DomainBookingStatus;
  paymentStatus: DomainPaymentStatus;
  expiresAt: Date | null;
  createdAt: Date;
  idempotencyHash: string | null;
};

export type PublicBooking = {
  publicCode: string;
  service: {
    slug: string;
    name: string;
    durationMinutes: number | null;
  };
  status: DomainBookingStatus;
  paymentStatus: DomainPaymentStatus;
  fulfillmentType: DomainFulfillment;
  modality: DomainModality | null;
  scheduledStart: string | null;
  timezone: string;
  priceCents: number;
  currency: string;
  expiresAt: string | null;
  createdAt: string;
};

export function toPublicBooking(booking: BookingRecord): PublicBooking {
  return {
    publicCode: booking.publicCode,
    service: booking.service,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    fulfillmentType: booking.fulfillmentType,
    modality: booking.modality,
    scheduledStart: booking.scheduledStart?.toISOString() ?? null,
    timezone: booking.timezone,
    priceCents: booking.priceCents,
    currency: booking.currency,
    expiresAt: booking.expiresAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
  };
}
