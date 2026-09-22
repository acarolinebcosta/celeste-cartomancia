import { mockReadings } from "@/data/readings";
import { isModality } from "@/data/modalities";
import type { BookingDraft, Modality, Reading } from "@/types/domain";

export function createEmptyBooking(readings: Reading[]): BookingDraft {
  const firstReading = readings[0];
  if (!firstReading) throw new Error("Booking requires at least one active reading.");
  return {
  readingSlug: firstReading.slug,
  modality: firstReading.fulfillmentType === "async" ? "message" : null,
  date: "",
  time: "",
  question: "",
  name: "",
  email: "",
  whatsapp: "",
  context: "",
  termsAccepted: false,
  };
}

export const emptyBooking = createEmptyBooking(mockReadings);

export type BookingQueryState = {
  booking: BookingDraft;
  modalityFilter: Modality | null;
};

export function initializeBookingFromSearch(search: string, readings: Reading[] = mockReadings): BookingQueryState {
  const empty = createEmptyBooking(readings);
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const requestedReading = readings.find((reading) => reading.slug === params.get("servico"));
  const requestedModality = isModality(params.get("modalidade")) ? params.get("modalidade") as Modality : null;
  const hasExplicitReading = Boolean(requestedReading);

  if (requestedModality && !hasExplicitReading) {
    const compatibleReading = readings.find((reading) => reading.availableModalities.includes(requestedModality));
    return {
      booking: {
        ...empty,
        readingSlug: compatibleReading?.slug ?? readings[0].slug,
        modality: compatibleReading ? requestedModality : null,
      },
      modalityFilter: compatibleReading ? requestedModality : null,
    };
  }

  const reading = requestedReading ?? readings[0];
  const modality = requestedModality && reading.availableModalities.includes(requestedModality)
    ? requestedModality
    : reading.fulfillmentType === "async" ? "message" : null;

  return {
    booking: { ...empty, readingSlug: reading.slug, modality },
    modalityFilter: null,
  };
}

export function selectReading(current: BookingDraft, nextReading: Reading): BookingDraft {
  const modality = current.modality && nextReading.availableModalities.includes(current.modality)
    ? current.modality
    : nextReading.fulfillmentType === "async" ? "message" : null;
  return {
    ...current,
    readingSlug: nextReading.slug,
    modality,
    date: "",
    time: "",
  };
}

export function selectModality(current: BookingDraft, modality: Modality): BookingDraft {
  return { ...current, modality, date: "", time: "" };
}

export function selectDate(current: BookingDraft, date: string): BookingDraft {
  return { ...current, date, time: "" };
}

export function isBookingCompatible(booking: BookingDraft, reading: Reading) {
  if (booking.readingSlug !== reading.slug) return false;
  if (!booking.modality || !reading.availableModalities.includes(booking.modality)) return false;
  if (reading.fulfillmentType === "scheduled") return Boolean(booking.date && booking.time);
  return !booking.date && !booking.time && booking.modality === "message" && Boolean(booking.question.trim());
}

export type BookingStep = "reading" | "modality" | "schedule" | "question" | "details" | "summary" | "payment";

export function getBookingSteps(reading: Reading): BookingStep[] {
  return reading.fulfillmentType === "async"
    ? ["reading", "question", "details", "summary", "payment"]
    : ["reading", "modality", "schedule", "details", "summary", "payment"];
}

export const stepLabels: Record<BookingStep, string> = {
  reading: "Leitura",
  modality: "Modalidade",
  schedule: "Data e horário",
  question: "Pergunta",
  details: "Seus dados",
  summary: "Resumo",
  payment: "Pagamento",
};
