import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError } from "@/lib/apiClient";

describe("ApiClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("centraliza JSON, headers e request id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "x-request-id": "req-123" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(new ApiClient("http://api.test").request("/resource", { method: "POST", body: { value: 1 } })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/resource", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ value: 1 }),
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }));
  });

  it("mapeia erro de domínio e erro de rede", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: "SLOT_UNAVAILABLE", message: "Indisponível" },
    }), { status: 409, headers: { "x-request-id": "req-conflict" } })));
    await expect(new ApiClient("http://api.test").request("/bookings")).rejects.toMatchObject({
      code: "SLOT_UNAVAILABLE",
      status: 409,
      requestId: "req-conflict",
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(new ApiClient("http://api.test").request("/bookings")).rejects.toBeInstanceOf(ApiError);
    await expect(new ApiClient("http://api.test").request("/bookings")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
