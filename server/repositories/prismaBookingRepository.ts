import { BookingStatus, PaymentStatus, Prisma, type PrismaClient } from "@prisma/client";
import { errors } from "../errors/appError.js";
import { PublicCodeCollisionError } from "../errors/repositoryErrors.js";
import type { BookingRecord } from "../domain/types.js";
import type { AtomicBookingInput, BookingRepository } from "./contracts.js";

const bookingInclude = { service: { select: { slug: true, name: true, durationMinutes: true } } } as const;

type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

function mapBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    publicCode: row.publicCode,
    service: row.service,
    fulfillmentType: row.fulfillmentType,
    modality: row.modality,
    scheduledStart: row.scheduledStart,
    scheduledEnd: row.scheduledEnd,
    timezone: row.timezone,
    priceCents: row.priceCents,
    currency: row.currency,
    status: row.status,
    paymentStatus: row.paymentStatus,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    idempotencyHash: row.idempotencyHash,
  };
}

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAtomic(input: AtomicBookingInput, now: Date) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`idempotency:${input.idempotencyKey}`}, 0))`;

      const existing = await transaction.booking.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: bookingInclude,
      });
      if (existing) {
        if (existing.idempotencyHash !== input.idempotencyHash) throw errors.idempotencyConflict();
        return { booking: mapBooking(existing), replayed: true };
      }

      if (input.reservation && input.scheduledStart && input.scheduledEnd) {
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`schedule:${input.reservation.lockDate}`}, 0))`;
        await transaction.booking.updateMany({
          where: { status: BookingStatus.PENDING_PAYMENT, expiresAt: { lte: now } },
          data: { status: BookingStatus.EXPIRED, paymentStatus: PaymentStatus.EXPIRED },
        });

        const bufferMs = input.reservation.bufferMinutes * 60_000;
        const conflict = await transaction.booking.findFirst({
          where: {
            scheduledStart: { lt: new Date(input.scheduledEnd.getTime() + bufferMs) },
            scheduledEnd: { gt: new Date(input.scheduledStart.getTime() - bufferMs) },
            OR: [
              { status: BookingStatus.CONFIRMED },
              { status: BookingStatus.PENDING_PAYMENT, expiresAt: { gt: now } },
            ],
          },
          select: { id: true },
        });
        if (conflict) throw errors.slotUnavailable();
      }

      const booking = await transaction.booking.create({
        data: {
          publicCode: input.publicCode,
          serviceId: input.serviceId,
          fulfillmentType: input.fulfillmentType,
          modality: input.modality,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerWhatsapp: input.customerWhatsapp,
          question: input.question,
          context: input.context,
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
          timezone: input.timezone,
          priceCents: input.priceCents,
          currency: "BRL",
          status: BookingStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.AWAITING_PAYMENT,
          expiresAt: input.expiresAt,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
          utmTerm: input.utmTerm,
          termsVersion: input.termsVersion,
          privacyVersion: input.privacyVersion,
          termsAcceptedAt: input.termsAcceptedAt,
          idempotencyKey: input.idempotencyKey,
          idempotencyHash: input.idempotencyHash,
        },
        include: bookingInclude,
      });
      return { booking: mapBooking(booking), replayed: false };
      }, { maxWait: 5_000, timeout: 15_000 });
    } catch (error) {
      if (isPublicCodeUniqueViolation(error)) throw new PublicCodeCollisionError();
      throw error;
    }
  }

  async findByPublicCode(publicCode: string, now: Date) {
    await this.prisma.booking.updateMany({
      where: { publicCode, status: BookingStatus.PENDING_PAYMENT, expiresAt: { lte: now } },
      data: { status: BookingStatus.EXPIRED, paymentStatus: PaymentStatus.EXPIRED },
    });
    const booking = await this.prisma.booking.findUnique({ where: { publicCode }, include: bookingInclude });
    return booking ? mapBooking(booking) : null;
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const booking = await this.prisma.booking.findUnique({ where: { idempotencyKey }, include: bookingInclude });
    return booking ? mapBooking(booking) : null;
  }
}

function isPublicCodeUniqueViolation(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = error.meta?.target;
  if (Array.isArray(target)) return target.some((field) => field === "publicCode");
  return typeof target === "string" && (target.includes("publicCode") || target.includes("Booking_publicCode_key"));
}
