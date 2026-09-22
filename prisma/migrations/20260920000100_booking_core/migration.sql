CREATE TYPE "FulfillmentType" AS ENUM ('ASYNC', 'SCHEDULED');
CREATE TYPE "Modality" AS ENUM ('MESSAGE', 'VOICE', 'VIDEO');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "PaymentStatus" AS ENUM ('AWAITING_PAYMENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'REFUNDED');

CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "explores" TEXT[],
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "durationMinutes" INTEGER,
    "priceCents" INTEGER NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "estimatedDelivery" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceModality" (
    "serviceId" UUID NOT NULL,
    "modality" "Modality" NOT NULL,
    CONSTRAINT "ServiceModality_pkey" PRIMARY KEY ("serviceId", "modality")
);

CREATE TABLE "AvailabilityRule" (
    "id" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "timezone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityException" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "available" BOOLEAN NOT NULL,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "timezone" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityBlock" (
    "id" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "publicCode" TEXT NOT NULL,
    "serviceId" UUID NOT NULL,
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "modality" "Modality",
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerWhatsapp" TEXT NOT NULL,
    "question" TEXT,
    "context" TEXT,
    "scheduledStart" TIMESTAMPTZ(3),
    "scheduledEnd" TIMESTAMPTZ(3),
    "timezone" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "expiresAt" TIMESTAMPTZ(3),
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "termsVersion" TEXT NOT NULL,
    "privacyVersion" TEXT NOT NULL,
    "termsAcceptedAt" TIMESTAMPTZ(3) NOT NULL,
    "idempotencyKey" TEXT,
    "idempotencyHash" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE UNIQUE INDEX "AvailabilityRule_dayOfWeek_startMinute_endMinute_timezone_key" ON "AvailabilityRule"("dayOfWeek", "startMinute", "endMinute", "timezone");
CREATE INDEX "AvailabilityException_date_timezone_idx" ON "AvailabilityException"("date", "timezone");
CREATE INDEX "AvailabilityBlock_startsAt_endsAt_idx" ON "AvailabilityBlock"("startsAt", "endsAt");
CREATE UNIQUE INDEX "Booking_publicCode_key" ON "Booking"("publicCode");
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");
CREATE INDEX "Booking_scheduledStart_scheduledEnd_idx" ON "Booking"("scheduledStart", "scheduledEnd");
CREATE INDEX "Booking_status_expiresAt_idx" ON "Booking"("status", "expiresAt");
CREATE INDEX "Booking_serviceId_createdAt_idx" ON "Booking"("serviceId", "createdAt");

ALTER TABLE "ServiceModality" ADD CONSTRAINT "ServiceModality_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Service" ADD CONSTRAINT "Service_priceCents_positive" CHECK ("priceCents" > 0);
ALTER TABLE "Service" ADD CONSTRAINT "Service_duration_by_fulfillment" CHECK (
  ("fulfillmentType" = 'ASYNC' AND "durationMinutes" IS NULL)
  OR ("fulfillmentType" = 'SCHEDULED' AND "durationMinutes" > 0)
);
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_valid_window" CHECK (
  "dayOfWeek" BETWEEN 1 AND 7
  AND "startMinute" >= 0
  AND "endMinute" <= 1440
  AND "startMinute" < "endMinute"
  AND "bufferMinutes" >= 0
);
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_valid_window" CHECK ("startsAt" < "endsAt");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_priceCents_positive" CHECK ("priceCents" > 0);
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_shape_by_fulfillment" CHECK (
  ("fulfillmentType" = 'ASYNC' AND "modality" = 'MESSAGE' AND "question" IS NOT NULL AND "scheduledStart" IS NULL AND "scheduledEnd" IS NULL AND "expiresAt" IS NULL)
  OR ("fulfillmentType" = 'SCHEDULED' AND "modality" IN ('VOICE', 'VIDEO') AND "question" IS NULL AND "scheduledStart" IS NOT NULL AND "scheduledEnd" IS NOT NULL AND "expiresAt" IS NOT NULL)
);
