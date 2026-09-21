import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RouteEffects from "@/components/RouteEffects";
import { ANALYTICS_EVENT_NAME, setAnalyticsConsent } from "@/lib/analytics";

describe("efeitos de rota", () => {
  it("emite um page_view por rota e atualiza metadata da SPA", async () => {
    const listener = vi.fn();
    window.addEventListener(ANALYTICS_EVENT_NAME, listener);
    setAnalyticsConsent("accepted");
    render(<RouteEffects />);

    await waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toMatchObject({ event: "page_view", properties: { path: "/" } });

    window.history.pushState({}, "", "/termos");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(listener).toHaveBeenCalledTimes(2));
    expect(document.title).toBe("Termos de Uso | Celeste");

    window.dispatchEvent(new PopStateEvent("popstate"));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
