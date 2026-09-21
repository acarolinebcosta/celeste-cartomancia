export type Modality = "message" | "voice" | "video";

export type FulfillmentType = "scheduled" | "async";

export type Reading = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  audience: string;
  explores: string[];
  fulfillmentType: FulfillmentType;
  durationMinutes: number | null;
  price: number;
  featured?: boolean;
  availableModalities: Modality[];
  estimatedDelivery?: string;
};

export type BookingDraft = {
  readingSlug: string;
  modality: Modality | null;
  date: string;
  time: string;
  question: string;
  name: string;
  email: string;
  whatsapp: string;
  context: string;
  termsAccepted: boolean;
};

export type BookingStatus = "draft" | "pending_payment" | "confirmed" | "cancelled";

export type PaymentStatus =
  | "awaiting_payment"
  | "rejected"
  | "expired"
  | "cancelled"
  | "approved";

export type Booking = {
  publicCode: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  readingName: string;
  data: BookingDraft;
  utms: Record<string, string>;
  createdAt: string;
};

export type CreateBookingInput = {
  reading: Reading;
  data: BookingDraft;
  utms: Record<string, string>;
};
