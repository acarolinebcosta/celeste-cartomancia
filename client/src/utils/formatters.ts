import type { Reading } from "@/types/domain";

export const formatBRL = (priceCents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);

export const formatPriceFrom = (priceCents: number) => `A partir de ${formatBRL(priceCents)}`;

export const formatReadingDuration = (reading: Reading) =>
  reading.fulfillmentType === "async" ? "Leitura assíncrona" : `${reading.durationMinutes} minutos`;

export const formatDateLong = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(date);

export const formatDateShort = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(" de ", " ");

export const formatDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
