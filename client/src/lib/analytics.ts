export type UtmParams = Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term", string>>;

export type AnalyticsEventProperties = {
  page_view: { path: string };
  view_service: { service: string };
  select_service: { service: string };
  select_modality: { modality: string; service?: string };
  begin_booking: { source: string; service?: string };
  select_date: { date: string; service: string };
  select_time: { time: string; service: string };
  submit_customer_data: { service: string; fulfillmentType: string };
  begin_checkout: { service: string; modality: string; utms: UtmParams };
  mock_checkout_viewed: { service: string; paymentStatus: string };
  purchase: { transactionId: string; value: number; currency: "BRL" };
  whatsapp_click: { source: string };
};

export type AnalyticsEvent = keyof AnalyticsEventProperties;
export type ConsentValue = "accepted" | "declined";

export const UTM_STORAGE_KEY = "celeste_utm";
export const CONSENT_STORAGE_KEY = "celeste_analytics_consent";
export const ANALYTICS_EVENT_NAME = "celeste:analytics";

export function track<Event extends AnalyticsEvent>(event: Event, properties: AnalyticsEventProperties[Event]) {
  if (typeof window === "undefined" || getAnalyticsConsent() !== "accepted") return false;

  // Single adapter boundary for future GA4, Meta Pixel and Google Ads integrations.
  // PURCHASE MUST ONLY BE FIRED AFTER VERIFIED BACKEND PAYMENT CONFIRMATION.
  window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, { detail: { event, properties } }));
  if (import.meta.env.DEV) console.info(`[Celeste analytics] ${event}`, properties);
  return true;
}

export function captureUtmParams(search = typeof window !== "undefined" ? window.location.search : "") {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(search);
  const keys: (keyof UtmParams)[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const captured: UtmParams = {};

  keys.forEach((key) => {
    const value = params.get(key)?.trim();
    if (value) captured[key] = value;
  });

  if (Object.keys(captured).length > 0) {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(captured));
  }
  return captured;
}

export function getStoredUtms(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(UTM_STORAGE_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? parsed as UtmParams : {};
  } catch {
    return {};
  }
}

export function getAnalyticsConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return value === "accepted" || value === "declined" ? value : null;
}

export function setAnalyticsConsent(value: ConsentValue) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent("celeste:consent", { detail: value }));
}
