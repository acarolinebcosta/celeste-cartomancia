import { createPayloadHash } from "../domain/idempotency.js";
import { createPublicCode } from "../domain/publicCode.js";
import { toPublicBooking } from "../domain/types.js";
import { errors } from "../errors/appError.js";
import { PublicCodeCollisionError } from "../errors/repositoryErrors.js";
import type { BookingRepository } from "../repositories/contracts.js";
import type { CreateBookingPayload } from "../schemas/bookingSchemas.js";
import { toDomainModality } from "../schemas/bookingSchemas.js";
import { AvailabilityService } from "./availabilityService.js";
import { ServiceCatalogService } from "./serviceCatalogService.js";

type Clock = () => Date;
const MAX_PUBLIC_CODE_ATTEMPTS = 3;

export type BookingServiceConfig = {
  timezone: string;
  holdMinutes: number;
  termsVersion: string;
  privacyVersion: string;
};

export class BookingService {
  constructor(
    private readonly catalog: ServiceCatalogService,
    private readonly availability: AvailabilityService,
    private readonly bookings: BookingRepository,
    private readonly config: BookingServiceConfig,
    private readonly clock: Clock = () => new Date(),
    private readonly publicCodeFactory: () => string = createPublicCode,
  ) {}

  async create(payload: CreateBookingPayload, idempotencyKey: string) {
    const now = this.clock();
    const idempotencyHash = createPayloadHash(payload);
    const existing = await this.bookings.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      if (existing.idempotencyHash !== idempotencyHash) throw errors.idempotencyConflict();
      return { booking: toPublicBooking(existing), replayed: true };
    }
    const service = await this.catalog.requireService(payload.serviceSlug);
    const modality = toDomainModality(payload.modality);
    if (!service.modalities.includes(modality)) throw errors.invalidModality();

    let scheduledStart: Date | null = null;
    let scheduledEnd: Date | null = null;
    let expiresAt: Date | null = null;
    let question: string | null = null;
    let reservation: { lockDate: string; bufferMinutes: number } | undefined;

    if (service.fulfillmentType === "ASYNC") {
      if (payload.date || payload.time) throw errors.invalidFulfillment("Uma leitura assíncrona não aceita data ou horário.");
      if (modality !== "MESSAGE" || !payload.question) {
        throw errors.invalidFulfillment("Uma leitura assíncrona exige uma pergunta e a modalidade message.");
      }
      question = payload.question;
    } else {
      if (!payload.date || !payload.time) throw errors.invalidFulfillment("Uma leitura agendada exige data e horário.");
      if (payload.question) throw errors.invalidFulfillment("Uma leitura agendada não aceita o campo question.");
      const slot = await this.availability.assertSlotAvailable({
        serviceSlug: service.slug,
        modality,
        date: payload.date,
        time: payload.time,
      });
      scheduledStart = slot.startsAt;
      scheduledEnd = slot.endsAt;
      expiresAt = new Date(now.getTime() + this.config.holdMinutes * 60_000);
      reservation = { lockDate: payload.date, bufferMinutes: slot.bufferMinutes };
    }

    const bookingInput = {
      serviceId: service.id,
      fulfillmentType: service.fulfillmentType,
      modality,
      customerName: payload.customer.name,
      customerEmail: payload.customer.email,
      customerWhatsapp: payload.customer.whatsapp,
      question,
      context: payload.context || null,
      scheduledStart,
      scheduledEnd,
      timezone: this.config.timezone,
      priceCents: service.priceCents,
      expiresAt,
      utmSource: payload.utms.utm_source ?? null,
      utmMedium: payload.utms.utm_medium ?? null,
      utmCampaign: payload.utms.utm_campaign ?? null,
      utmContent: payload.utms.utm_content ?? null,
      utmTerm: payload.utms.utm_term ?? null,
      termsVersion: this.config.termsVersion,
      privacyVersion: this.config.privacyVersion,
      termsAcceptedAt: now,
      idempotencyKey,
      idempotencyHash,
      reservation,
    };

    let result;
    for (let attempt = 1; attempt <= MAX_PUBLIC_CODE_ATTEMPTS; attempt += 1) {
      try {
        result = await this.bookings.createAtomic({
          ...bookingInput,
          publicCode: this.publicCodeFactory(),
        }, now);
        break;
      } catch (error) {
        if (!(error instanceof PublicCodeCollisionError) || attempt === MAX_PUBLIC_CODE_ATTEMPTS) throw error;
      }
    }
    if (!result) throw new Error("Public code generation exhausted without a repository result.");

    return { booking: toPublicBooking(result.booking), replayed: result.replayed };
  }

  async getByPublicCode(publicCode: string) {
    const booking = await this.bookings.findByPublicCode(publicCode, this.clock());
    if (!booking) throw errors.bookingNotFound();
    return toPublicBooking(booking);
  }
}
