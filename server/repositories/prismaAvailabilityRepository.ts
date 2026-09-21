import { BookingStatus, PaymentStatus, type PrismaClient } from "@prisma/client";
import type { AvailabilityRepository } from "./contracts.js";

export class PrismaAvailabilityRepository implements AvailabilityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async expireStaleBookings(now: Date) {
    await this.prisma.booking.updateMany({
      where: { status: BookingStatus.PENDING_PAYMENT, expiresAt: { lte: now } },
      data: { status: BookingStatus.EXPIRED, paymentStatus: PaymentStatus.EXPIRED },
    });
  }

  async listRules(timezone: string) {
    return this.prisma.availabilityRule.findMany({
      where: { timezone, active: true },
      select: { dayOfWeek: true, startMinute: true, endMinute: true, bufferMinutes: true },
      orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
    });
  }

  async listExceptions(from: Date, to: Date, timezone: string) {
    const rows = await this.prisma.availabilityException.findMany({
      where: { date: { gte: from, lt: to }, timezone },
      select: { date: true, available: true, startMinute: true, endMinute: true },
    });
    return rows.map((row) => ({ ...row, date: row.date.toISOString().slice(0, 10) }));
  }

  async listBlocks(from: Date, to: Date) {
    return this.prisma.availabilityBlock.findMany({
      where: { startsAt: { lt: to }, endsAt: { gt: from } },
      select: { startsAt: true, endsAt: true },
    });
  }

  async listBlockingBookings(from: Date, to: Date, now: Date) {
    return this.prisma.booking.findMany({
      where: {
        scheduledStart: { lt: to },
        scheduledEnd: { gt: from },
        OR: [
          { status: BookingStatus.CONFIRMED },
          { status: BookingStatus.PENDING_PAYMENT, expiresAt: { gt: now } },
        ],
      },
      select: { scheduledStart: true, scheduledEnd: true },
    }).then((rows) => rows.flatMap((row) => row.scheduledStart && row.scheduledEnd
      ? [{ startsAt: row.scheduledStart, endsAt: row.scheduledEnd }]
      : []));
  }
}
