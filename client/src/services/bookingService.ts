import type { BookingState, Reading } from "@/lib/content";
import { getStoredUtms } from "@/lib/analytics";

export type PaymentStatus = "aguardando_pagamento" | "pago" | "cancelado" | "expirado" | "reembolsado";
export type BookingStatus = "rascunho" | "pendente" | "confirmado" | "cancelado";

export type BookingPreview = {
  publicCode: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  readingName: string;
  booking: BookingState;
  utms: Record<string, string>;
};

/** Adapter temporário: substituir pelo contrato HTTP/tRPC do backend sem alterar os componentes. */
export function createMockBookingPreview(booking: BookingState, reading: Reading): BookingPreview {
  return {
    publicCode: `CEL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: "pendente",
    paymentStatus: "aguardando_pagamento",
    readingName: reading.name,
    booking,
    utms: getStoredUtms(),
  };
}

/** Futuro adapter Mercado Pago: nenhum pagamento real é executado nesta versão. */
export async function createPaymentPreference(_booking: BookingPreview) {
  return { mode: "mock", status: "awaiting_credentials" as const };
}
