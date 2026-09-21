import { z } from "zod";

const whatsappPattern = /^[+()\d\s-]{10,20}$/;

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.email("Informe um e-mail válido."),
  whatsapp: z.string().trim().regex(whatsappPattern, "Informe um WhatsApp válido com DDD."),
  context: z.string().trim().max(1000, "Use no máximo 1000 caracteres."),
  termsAccepted: z.boolean().refine((value) => value, "Você precisa aceitar os Termos e a Política de Privacidade."),
});

export const asyncQuestionSchema = z.object({
  question: z.string().trim().min(10, "Descreva sua questão com pelo menos 10 caracteres.").max(1000, "Use no máximo 1000 caracteres."),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type AsyncQuestionFormData = z.infer<typeof asyncQuestionSchema>;
