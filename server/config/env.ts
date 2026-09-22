import { z } from "zod";

const booleanFromEnv = z.string().optional().transform((value) => value !== "false");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  API_HOST: z.string().default("0.0.0.0"),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  BOOKING_HOLD_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  BUSINESS_TIMEZONE: z.string().default("America/Sao_Paulo"),
  TERMS_VERSION: z.string().min(1).default("2026-09-draft"),
  PRIVACY_VERSION: z.string().min(1).default("2026-09-draft"),
  ENABLE_SWAGGER: booleanFromEnv,
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  databaseUrl: string;
  port: number;
  host: string;
  frontendOrigin: string;
  bookingHoldMinutes: number;
  businessTimezone: string;
  termsVersion: string;
  privacyVersion: string;
  enableSwagger: boolean;
};

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(environment);
  return {
    nodeEnv: parsed.NODE_ENV,
    databaseUrl: parsed.DATABASE_URL,
    port: parsed.PORT,
    host: parsed.API_HOST,
    frontendOrigin: parsed.FRONTEND_ORIGIN,
    bookingHoldMinutes: parsed.BOOKING_HOLD_MINUTES,
    businessTimezone: parsed.BUSINESS_TIMEZONE,
    termsVersion: parsed.TERMS_VERSION,
    privacyVersion: parsed.PRIVACY_VERSION,
    enableSwagger: parsed.ENABLE_SWAGGER,
  };
}
