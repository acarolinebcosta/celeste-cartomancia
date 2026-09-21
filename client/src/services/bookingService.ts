import type { Booking, CreateBookingInput } from "@/types/domain";

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
      status: "pending_payment",
      paymentStatus: "awaiting_payment",
      readingName: input.reading.name,
      data: { ...input.data },
      utms: { ...input.utms },
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

export const bookingService: BookingService = new MockBookingService();
