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

/** Painel /admin/estacoes/nova — cadastro de uma estação parceira real + conta de operador. */
export const criarEstacaoAdminSchema = z.object({
  municipio: z.string().min(2, "Indica o município"),
  distrito: z.string().min(2, "Indica o distrito/bairro"),
  nome: z.string().min(2, "Indica o nome da estação"),
  morada: z.string().min(3, "Indica a morada"),
  latitude: z.number({ invalid_type_error: "Latitude inválida" }),
  longitude: z.number({ invalid_type_error: "Longitude inválida" }),
  horario: z.string().min(2, "Indica o horário"),
  telefone: z.string().optional().or(z.literal("")),
  capacidade: z.number().int().min(1).default(1),
  operadorNome: z.string().min(2, "Indica o nome do operador"),
  operadorEmail: z.string().email("Email do operador inválido"),
  operadorPassword: z.string().min(6, "Mínimo de 6 caracteres").optional().or(z.literal("")),
  operadorWhatsapp: z
    .string()
    .regex(/^\+244\d{9}$/, "Usa o formato +244XXXXXXXXX")
    .optional()
    .or(z.literal("")),
});
