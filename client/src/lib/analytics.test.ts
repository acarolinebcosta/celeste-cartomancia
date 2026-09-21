import { describe, expect, it, vi } from "vitest";
import { ANALYTICS_EVENT_NAME, CONSENT_STORAGE_KEY, UTM_STORAGE_KEY, captureUtmParams, getAnalyticsConsent, getStoredUtms, setAnalyticsConsent, track } from "@/lib/analytics";
import { getReading } from "@/data/readings";
import { emptyBooking } from "@/features/booking/bookingState";
import { MockBookingService } from "@/services/bookingService";
import { MockPaymentService } from "@/services/paymentService";

describe("analytics e atribuição", () => {
  it("captura os cinco parâmetros UTM suportados na sessão", () => {
    captureUtmParams("?utm_source=google&utm_medium=cpc&utm_campaign=lancamento&utm_content=carta&utm_term=tarot&ignorar=x");
    expect(getStoredUtms()).toEqual({ utm_source: "google", utm_medium: "cpc", utm_campaign: "lancamento", utm_content: "carta", utm_term: "tarot" });
    expect(window.sessionStorage.getItem(UTM_STORAGE_KEY)).toBeTruthy();
  });

  it("não sobrescreve atribuição quando a nova URL não tem UTM", () => {
    captureUtmParams("?utm_source=instagram");
    captureUtmParams("?servico=amor-relacoes");
    expect(getStoredUtms()).toEqual({ utm_source: "instagram" });
  });

  it("tolera storage corrompido", () => {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, "{");
    expect(getStoredUtms()).toEqual({});
  });

  it("bloqueia tracking sem consentimento e após recusa", () => {
    const listener = vi.fn();
    window.addEventListener(ANALYTICS_EVENT_NAME, listener);
    expect(track("page_view", { path: "/" })).toBe(false);
    setAnalyticsConsent("declined");
    expect(track("page_view", { path: "/" })).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("emite evento tipado após aceite", () => {
    const listener = vi.fn();
    window.addEventListener(ANALYTICS_EVENT_NAME, listener);
    setAnalyticsConsent("accepted");
    expect(getAnalyticsConsent()).toBe("accepted");
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("accepted");
    expect(track("select_service", { service: "pergunta-direta" })).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("não emite purchase no fluxo mock pendente", async () => {
    const events: string[] = [];
    window.addEventListener(ANALYTICS_EVENT_NAME, (event) => events.push((event as CustomEvent).detail.event));
    setAnalyticsConsent("accepted");
    const booking = await new MockBookingService().createBooking({ reading: getReading("pergunta-direta"), data: emptyBooking, utms: {} });
    const checkout = await new MockPaymentService().createCheckout(booking.publicCode, "pix");
    track("mock_checkout_viewed", { service: "pergunta-direta", paymentStatus: checkout.status });
    expect(events).toContain("mock_checkout_viewed");
    expect(events).not.toContain("purchase");
  });
});
