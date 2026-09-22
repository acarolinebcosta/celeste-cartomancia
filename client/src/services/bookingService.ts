import type { Booking, CreateBookingInput } from "@/types/domain";
import { ApiError, apiClient } from "@/lib/apiClient";

const STORAGE_PREFIX = "celeste_mock_booking:";

export interface BookingService {
  createBooking(input: CreateBookingInput): Promise<Booking>;
  getBooking(publicCode: string): Promise<Booking | null>;
}

export function createMockPublicCode(random = Math.random) {
  const token = random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
  return `CEL-${token}`;
}

/**
 * Preview only. Production codes MUST be generated and validated server-side;
 * this value is not a security boundary or a durable identifier.
 */
export class MockBookingService implements BookingService {
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const booking: Booking = {
      publicCode: createMockPublicCode(),
      service: {
        slug: input.reading.slug,
        name: input.reading.name,
        durationMinutes: input.reading.durationMinutes,
      },
      status: "pending_payment",
      paymentStatus: "awaiting_payment",
      fulfillmentType: input.reading.fulfillmentType,
      modality: input.data.modality,
      scheduledStart: input.data.date && input.data.time ? `${input.data.date}T${input.data.time}:00-03:00` : null,
      timezone: "America/Sao_Paulo",
      priceCents: input.reading.price * 100,
      currency: "BRL",
      expiresAt: input.reading.fulfillmentType === "scheduled" ? new Date(Date.now() + 15 * 60_000).toISOString() : null,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(`${STORAGE_PREFIX}${booking.publicCode}`, JSON.stringify(booking));
    }
    return booking;
  }

  async getBooking(publicCode: string): Promise<Booking | null> {
    if (typeof window === "undefined") return null;
    const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${publicCode}`);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as Booking;
    } catch {
      return null;
    }
  }
}

type ApiBooking = {
  publicCode: string;
  service: Booking["service"];
  status: Uppercase<Booking["status"]>;
  paymentStatus: Uppercase<Booking["paymentStatus"]>;
  fulfillmentType: Uppercase<Booking["fulfillmentType"]>;
  modality: Uppercase<NonNullable<Booking["modality"]>> | null;
  scheduledStart: string | null;
  timezone: string;
  priceCents: number;
  currency: "BRL";
  expiresAt: string | null;
  createdAt: string;
};

function mapApiBooking(booking: ApiBooking): Booking {
  return {
    ...booking,
    status: booking.status.toLowerCase() as Booking["status"],
    paymentStatus: booking.paymentStatus.toLowerCase() as Booking["paymentStatus"],
    fulfillmentType: booking.fulfillmentType.toLowerCase() as Booking["fulfillmentType"],
    modality: booking.modality?.toLowerCase() as Booking["modality"],
  };
}

export class ApiBookingService implements BookingService {
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const { data } = input;
    const payload = {
      serviceSlug: input.reading.slug,
      modality: data.modality,
      ...(input.reading.fulfillmentType === "scheduled" ? { date: data.date, time: data.time } : { question: data.question }),
      customer: { name: data.name, email: data.email, whatsapp: data.whatsapp },
      context: data.context,
      termsAccepted: data.termsAccepted,
      utms: input.utms,
    };
    const booking = await apiClient.request<ApiBooking>("/bookings", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: payload,
    });
    return mapApiBooking(booking);
  }

  async getBooking(publicCode: string): Promise<Booking | null> {
    try {
      return mapApiBooking(await apiClient.request<ApiBooking>(`/bookings/${encodeURIComponent(publicCode)}`));
    } catch (error) {
      if (error instanceof ApiError && error.code === "BOOKING_NOT_FOUND") return null;
      throw error;
    }
  }
}

export const usingMockBookingApi = import.meta.env.VITE_USE_MOCK_API !== "false";
export const bookingService: BookingService = usingMockBookingApi
  ? new MockBookingService()
  : new ApiBookingService();
