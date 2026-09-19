export type AnalyticsEvent =
  | "page_view"
  | "view_service"
  | "select_service"
  | "select_modality"
  | "begin_booking"
  | "select_date"
  | "select_time"
  | "begin_checkout"
  | "purchase"
  | "whatsapp_click";

const UTM_KEY = "celeste_utm";
const CONSENT_KEY = "celeste_cookie_consent";

export function track(event: AnalyticsEvent, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const consent = window.localStorage.getItem(CONSENT_KEY);
  if (consent !== "accepted") return;

  // Adapter único: GA4, Meta Pixel e Google Ads podem ser conectados aqui via env/SDK.
  window.dispatchEvent(new CustomEvent("celeste:analytics", { detail: { event, properties } }));
  if (import.meta.env.DEV) console.info(`[Celeste analytics] ${event}`, properties);
}

export function captureUtmParams() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const current = Object.fromEntries(keys.filter((key) => params.get(key)).map((key) => [key, params.get(key)]));
  if (Object.keys(current).length > 0) window.sessionStorage.setItem(UTM_KEY, JSON.stringify(current));
}

export function getStoredUtms(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(UTM_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getCookieConsent() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CONSENT_KEY) as "accepted" | "declined" | null;
}

export function setCookieConsent(value: "accepted" | "declined") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new Event("celeste:consent"));
}
