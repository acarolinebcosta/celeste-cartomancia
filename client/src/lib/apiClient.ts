export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "SERVICE_NOT_FOUND"
  | "SERVICE_INACTIVE"
  | "INVALID_MODALITY"
  | "INVALID_FULFILLMENT"
  | "SLOT_UNAVAILABLE"
  | "BOOKING_NOT_FOUND"
  | "IDEMPOTENCY_CONFLICT"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

type ApiErrorBody = { error?: { code?: ApiErrorCode; message?: string } };

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown; timeoutMs?: number };

export class ApiClient {
  constructor(private readonly baseUrl: string, private readonly defaultTimeoutMs = 10_000) {}

  async request<Response>(path: string, options: RequestOptions = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? this.defaultTimeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...options.headers,
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      const requestId = response.headers.get("x-request-id") ?? undefined;
      const payload = await response.json().catch(() => null) as Response | ApiErrorBody | null;
      if (!response.ok) {
        const error = (payload as ApiErrorBody | null)?.error;
        throw new ApiError(error?.code ?? "INTERNAL_ERROR", error?.message ?? "Não foi possível concluir a solicitação.", response.status, requestId);
      }
      return payload as Response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NETWORK_ERROR", "Não foi possível conectar ao atendimento. Tente novamente.", 0);
    } finally {
      window.clearTimeout(timeout);
    }
  }
}

const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

export const apiClient = new ApiClient(apiUrl);
