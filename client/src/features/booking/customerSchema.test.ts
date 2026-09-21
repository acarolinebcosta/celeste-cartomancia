import { describe, expect, it } from "vitest";
import { asyncQuestionSchema, customerSchema } from "@/features/booking/customerSchema";

const validCustomer = { name: "Ana Costa", email: "ana@example.com", whatsapp: "(11) 99999-9999", context: "", termsAccepted: true };

describe("schemas do atendimento", () => {
  it("aceita dados válidos", () => {
    expect(customerSchema.safeParse(validCustomer).success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    expect(customerSchema.safeParse({ ...validCustomer, email: "ana@" }).success).toBe(false);
  });

  it("exige aceite dos termos", () => {
    const result = customerSchema.safeParse({ ...validCustomer, termsAccepted: false });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/aceitar/i);
  });

  it("valida WhatsApp com DDD", () => {
    expect(customerSchema.safeParse({ ...validCustomer, whatsapp: "123" }).success).toBe(false);
  });

  it("exige uma questão coerente no fluxo assíncrono", () => {
    expect(asyncQuestionSchema.safeParse({ question: "curta" }).success).toBe(false);
    expect(asyncQuestionSchema.safeParse({ question: "Como posso olhar para esta mudança?" }).success).toBe(true);
  });
});
