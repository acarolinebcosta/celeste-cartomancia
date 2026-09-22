export const BOOKING_INTENT_STORAGE_KEY = "celeste_booking_intent";

export type BookingIntent = {
  key: string;
  fingerprint: string;
};

type IntentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Deterministic, non-secret identifier. The persisted value never contains booking PII. */
export function createBookingIntentFingerprint(payload: unknown): string {
  const serialized = stableSerialize(payload);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  return `v1-${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

export class BookingIntentStore {
  private memoryIntent: BookingIntent | null = null;

  constructor(
    private readonly storage: IntentStorage | null = typeof window === "undefined" ? null : window.sessionStorage,
    private readonly keyFactory: () => string = () => crypto.randomUUID(),
  ) {}

  getOrCreate(payload: unknown): BookingIntent {
    const fingerprint = createBookingIntentFingerprint(payload);
    const current = this.read();
    if (current?.fingerprint === fingerprint) return current;
    const next = { key: this.keyFactory(), fingerprint };
    this.write(next);
    return next;
  }

  clear(key: string) {
    if (this.read()?.key !== key) return;
    this.memoryIntent = null;
    this.storage?.removeItem(BOOKING_INTENT_STORAGE_KEY);
  }

  private read(): BookingIntent | null {
    if (!this.storage) return this.memoryIntent;
    const stored = this.storage.getItem(BOOKING_INTENT_STORAGE_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as Partial<BookingIntent>;
      return typeof parsed.key === "string" && typeof parsed.fingerprint === "string"
        ? { key: parsed.key, fingerprint: parsed.fingerprint }
        : null;
    } catch {
      return null;
    }
  }

  private write(intent: BookingIntent) {
    this.memoryIntent = intent;
    this.storage?.setItem(BOOKING_INTENT_STORAGE_KEY, JSON.stringify(intent));
  }
}

export const bookingIntentStore = new BookingIntentStore();
