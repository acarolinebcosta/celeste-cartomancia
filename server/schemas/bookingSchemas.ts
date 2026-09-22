import { z } from "zod";

const modalitySchema = z.enum(["message", "voice", "video"]);
const customerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  whatsapp: z.string().trim().regex(/^\+?[0-9 ()-]{10,20}$/),
}).strict();

const utmsSchema = z.object({
  utm_source: z.string().trim().max(200).optional(),
  utm_medium: z.string().trim().max(200).optional(),
  utm_campaign: z.string().trim().max(200).optional(),
  utm_content: z.string().trim().max(200).optional(),
  utm_term: z.string().trim().max(200).optional(),
}).strict().default({});

export const createBookingSchema = z.object({
  serviceSlug: z.string().trim().min(1).max(120),
  modality: modalitySchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
  question: z.string().trim().min(10).max(2_000).optional(),
  customer: customerSchema,
  context: z.string().trim().max(2_000).optional().default(""),
  termsAccepted: z.literal(true),
  utms: utmsSchema,
}).strict();

export const availabilityQuerySchema = z.object({
  serviceSlug: z.string().trim().min(1).max(120),
  modality: modalitySchema,
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

export const publicCodeSchema = z.string().regex(/^CEL-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);

export const idempotencyKeySchema = z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/);

export type CreateBookingPayload = z.infer<typeof createBookingSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export function toDomainModality(modality: z.infer<typeof modalitySchema>) {
  return modality.toUpperCase() as "MESSAGE" | "VOICE" | "VIDEO";
}
