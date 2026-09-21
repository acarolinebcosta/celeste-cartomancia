import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import AnalyticsConsent from "@/components/AnalyticsConsent";
import { getAnalyticsConsent } from "@/lib/analytics";

describe("consentimento de analytics", () => {
  it("aceita e fecha o aviso", async () => {
    const user = userEvent.setup();
    render(<AnalyticsConsent />);
    await user.click(screen.getByRole("button", { name: "Aceitar" }));
    expect(getAnalyticsConsent()).toBe("accepted");
    expect(screen.queryByLabelText("Preferências de analytics")).not.toBeInTheDocument();
  });

  it("permite recusar sem carregar analytics", async () => {
    const user = userEvent.setup();
    render(<AnalyticsConsent />);
    await user.click(screen.getByRole("button", { name: "Recusar" }));
    expect(getAnalyticsConsent()).toBe("declined");
  });
});
