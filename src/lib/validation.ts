import { z } from "zod";

export const registoSchema = z.object({
  nome: z.string().min(2, "Indica o teu nome completo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A password deve ter pelo menos 6 caracteres"),
  whatsapp: z
    .string()
    .regex(/^\+244\d{9}$/, "Usa o formato +244XXXXXXXXX")
    .optional()
    .or(z.literal("")),
});

export const criarSubscricaoSchema = z.object({
  pacoteId: z.string().min(1),
  estacaoId: z.string().min(1).optional(),
  ambitoUso: z.enum(["estacao_unica", "rede_aberta"]).default("rede_aberta"),
});

export const criarPagamentoSchema = z.object({
  subscricaoId: z.string().min(1),
  metodo: z.enum(["referencia", "transferencia"]),
});

export const confirmarPagamentoSchema = z.object({
  pagamentoId: z.string().min(1),
});

export const localizarEstacaoSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});
