import { DateTime } from "luxon";
import type { DomainModality, ServiceRecord, TimeRange } from "../domain/types.js";
import { dateRange, minutesToTime } from "../domain/time.js";
import { errors } from "../errors/appError.js";
import type { AvailabilityRepository } from "../repositories/contracts.js";
import { ServiceCatalogService } from "./serviceCatalogService.js";

export type AvailabilityRequest = {
  serviceSlug: string;
  modality: DomainModality;
  from: string;
  to: string;
};

export type AvailableSlot = { startTime: string; available: true };
export type AvailableDate = { date: string; slots: AvailableSlot[] };

type Clock = () => Date;

function overlaps(left: TimeRange, right: TimeRange) {
  return left.startsAt < right.endsAt && left.endsAt > right.startsAt;
}

export class AvailabilityService {
  constructor(
    private readonly catalog: ServiceCatalogService,
    private readonly availability: AvailabilityRepository,
    private readonly timezone: string,
    private readonly clock: Clock = () => new Date(),
  ) {}

  async getAvailability(input: AvailabilityRequest) {
    const service = await this.validateService(input.serviceSlug, input.modality);
    const days = dateRange(input.from, input.to, this.timezone);
    const now = this.clock();
    const rangeStart = days[0].toUTC().toJSDate();
    const rangeEnd = days.at(-1)!.plus({ days: 1 }).toUTC().toJSDate();

    await this.availability.expireStaleBookings(now);
    const [rules, exceptions, blocks, bookings] = await Promise.all([
      this.availability.listRules(this.timezone),
      this.availability.listExceptions(rangeStart, rangeEnd, this.timezone),
      this.availability.listBlocks(rangeStart, rangeEnd),
      this.availability.listBlockingBookings(rangeStart, rangeEnd, now),
    ]);

    const dates = days.flatMap((day): AvailableDate[] => {
      const isoDate = day.toISODate()!;
      const dateExceptions = exceptions.filter((item) => item.date === isoDate);
      const isFullyBlocked = dateExceptions.some((item) => !item.available && item.startMinute === null && item.endMinute === null);
      if (isFullyBlocked) return [];

      const overrideWindows = dateExceptions.filter((item) => item.available && item.startMinute !== null && item.endMinute !== null);
      const windows = overrideWindows.length > 0
        ? overrideWindows.map((item) => ({ startMinute: item.startMinute!, endMinute: item.endMinute!, bufferMinutes: 15 }))
        : rules.filter((rule) => rule.dayOfWeek === day.weekday);

      const blockedWindows = dateExceptions
        .filter((item) => !item.available && item.startMinute !== null && item.endMinute !== null)
        .map((item) => this.rangeFor(day, item.startMinute!, item.endMinute!));

      const slots = windows.flatMap((window) => this.generateWindowSlots(
        day,
        window,
        service.durationMinutes!,
        now,
        [...blocks, ...blockedWindows],
        bookings,
      ));
      return slots.length > 0 ? [{ date: isoDate, slots }] : [];
    });

    return { timezone: this.timezone, fulfillmentType: "SCHEDULED" as const, dates };
  }

  async assertSlotAvailable(input: Omit<AvailabilityRequest, "from" | "to"> & { date: string; time: string }) {
    const result = await this.getAvailability({ ...input, from: input.date, to: input.date });
    const date = result.dates.find((item) => item.date === input.date);
    if (!date?.slots.some((slot) => slot.startTime === input.time)) throw errors.slotUnavailable();

    const service = await this.catalog.requireService(input.serviceSlug);
    const rules = await this.availability.listRules(this.timezone);
    const day = DateTime.fromISO(input.date, { zone: this.timezone });
    const bufferMinutes = rules.find((rule) => rule.dayOfWeek === day.weekday)?.bufferMinutes ?? 15;
    const start = DateTime.fromISO(`${input.date}T${input.time}`, { zone: this.timezone });
    return {
      startsAt: start.toUTC().toJSDate(),
      endsAt: start.plus({ minutes: service.durationMinutes! }).toUTC().toJSDate(),
      bufferMinutes,
    };
  }

  private async validateService(serviceSlug: string, modality: DomainModality): Promise<ServiceRecord> {
    const service = await this.catalog.requireService(serviceSlug);
    if (service.fulfillmentType !== "SCHEDULED") {
      throw errors.invalidFulfillment("Serviços assíncronos não possuem agenda.");
    }
    if (!service.modalities.includes(modality)) throw errors.invalidModality();
    return service;
  }

  private rangeFor(day: DateTime, startMinute: number, endMinute: number): TimeRange {
    return {
      startsAt: day.plus({ minutes: startMinute }).toUTC().toJSDate(),
      endsAt: day.plus({ minutes: endMinute }).toUTC().toJSDate(),
    };
  }

  private generateWindowSlots(
    day: DateTime,
    window: { startMinute: number; endMinute: number; bufferMinutes: number },
    durationMinutes: number,
    now: Date,
    blocks: TimeRange[],
    bookings: TimeRange[],
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const step = durationMinutes + window.bufferMinutes;
    for (let minute = window.startMinute; minute + durationMinutes <= window.endMinute; minute += step) {
      const startsAt = day.plus({ minutes: minute }).toUTC().toJSDate();
      const endsAt = day.plus({ minutes: minute + durationMinutes }).toUTC().toJSDate();
      if (startsAt <= now) continue;

      const session = { startsAt, endsAt };
      const sessionWithBuffer = {
        startsAt: new Date(startsAt.getTime() - window.bufferMinutes * 60_000),
        endsAt: new Date(endsAt.getTime() + window.bufferMinutes * 60_000),
      };
      if (blocks.some((block) => overlaps(session, block))) continue;
      if (bookings.some((booking) => overlaps(sessionWithBuffer, booking))) continue;
      slots.push({ startTime: minutesToTime(minute), available: true });
    }
    return slots;
  }
}
