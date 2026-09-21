import { describe, expect, it } from "vitest";
import { availabilityQuerySchema, createBookingSchema, idempotencyKeySchema } from "../../schemas/bookingSchemas.js";

const valid = {
  serviceSlug: "pergunta-direta",
  modality: "message",
  question: "Quais movimentos merecem minha atenção?",
  customer: { name: "Ana", email: "ana@example.com", whatsapp: "51999999999" },
  context: "",
  termsAccepted: true,
  utms: {},
} as const;

describe("server schemas", () => {
  it("aceita o payload mínimo válido e UTMs opcionais", () => {
    expect(createBookingSchema.parse(valid).utms).toEqual({});
  });

  it("rejeita preço enviado pelo navegador", () => {
    expect(() => createBookingSchema.parse({ ...valid, priceCents: 1 })).toThrow();
  });

  it("rejeita termos, e-mail, WhatsApp e campos adicionais inválidos", () => {
    expect(() => createBookingSchema.parse({ ...valid, termsAccepted: false })).toThrow();
    expect(() => createBookingSchema.parse({ ...valid, customer: { ...valid.customer, email: "invalido" } })).toThrow();
    expect(() => createBookingSchema.parse({ ...valid, customer: { ...valid.customer, whatsapp: "123" } })).toThrow();
  });

  it("valida query de disponibilidade e chave de idempotência", () => {
    expect(availabilityQuerySchema.parse({ serviceSlug: "amor-relacoes", modality: "video", from: "2026-10-01", to: "2026-10-10" })).toBeTruthy();
    expect(idempotencyKeySchema.parse("booking:123456")).toBe("booking:123456");
    expect(() => idempotencyKeySchema.parse("curta")).toThrow();
  });
});
