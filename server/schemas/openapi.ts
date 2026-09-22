export const errorResponseSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        details: { type: "array", items: { type: "object", additionalProperties: true } },
      },
    },
  },
} as const;

export const publicBookingSchema = {
  type: "object",
  required: ["publicCode", "service", "status", "paymentStatus", "fulfillmentType", "modality", "scheduledStart", "timezone", "priceCents", "currency", "expiresAt", "createdAt"],
  properties: {
    publicCode: { type: "string", pattern: "^CEL-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$" },
    service: {
      type: "object",
      required: ["slug", "name", "durationMinutes"],
      properties: {
        slug: { type: "string" },
        name: { type: "string" },
        durationMinutes: { anyOf: [{ type: "integer" }, { type: "null" }] },
      },
    },
    status: { enum: ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"] },
    paymentStatus: { enum: ["AWAITING_PAYMENT", "APPROVED", "REJECTED", "EXPIRED", "CANCELLED", "REFUNDED"] },
    fulfillmentType: { enum: ["ASYNC", "SCHEDULED"] },
    modality: { anyOf: [{ enum: ["MESSAGE", "VOICE", "VIDEO"] }, { type: "null" }] },
    scheduledStart: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
    timezone: { type: "string" },
    priceCents: { type: "integer", minimum: 1 },
    currency: { type: "string", enum: ["BRL"] },
    expiresAt: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

const modality = { type: "string", enum: ["message", "voice", "video"] } as const;

export const createBookingBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["serviceSlug", "modality", "customer", "termsAccepted"],
  properties: {
    serviceSlug: { type: "string", minLength: 1, maxLength: 120 },
    modality,
    date: { type: "string", format: "date" },
    time: { type: "string", pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$" },
    question: { type: "string", minLength: 10, maxLength: 2000 },
    customer: {
      type: "object",
      additionalProperties: false,
      required: ["name", "email", "whatsapp"],
      properties: {
        name: { type: "string", minLength: 2, maxLength: 100 },
        email: { type: "string", format: "email", maxLength: 254 },
        whatsapp: { type: "string", minLength: 10, maxLength: 20 },
      },
    },
    context: { type: "string", maxLength: 2000 },
    termsAccepted: { type: "boolean", const: true },
    utms: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].map((key) => [key, { type: "string", maxLength: 200 }])),
    },
  },
} as const;

export const availabilityQueryOpenApiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["serviceSlug", "modality", "from", "to"],
  properties: {
    serviceSlug: { type: "string", minLength: 1, maxLength: 120 },
    modality,
    from: { type: "string", format: "date" },
    to: { type: "string", format: "date" },
  },
} as const;
