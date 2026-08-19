import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const validarSchema = z.object({ codigo: z.string().min(1) });

function inicioDoMes(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

/**
 * Processo 1, Passo 8 / Processo 2, Passo 5 — o operador da estação lê (ou
 * digita) o código do QR code do cartão do cliente. Este endpoint valida:
 *  - se o código existe;
 *  - se a subscrição está ativa e o cartão não expirou;
 *  - se o âmbito de uso permite lavar nesta estação (rede aberta vs. estação única);
 *  - se o cliente ainda tem lavagens disponíveis este mês (pacotes não-ilimitados).
 *
 * Não regista a lavagem aqui — isso só acontece em /api/estacao/confirmar-lavagem,
 * depois do operador confirmar visualmente os dados do cliente.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "operador" || !session.user.estacaoId) {
    return NextResponse.json({ erro: "É preciso iniciar sessão como operador de estação." }, { status: 401 });
  }

  const corpo = await req.json();
  const dados = validarSchema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: "Código em falta." }, { status: 400 });
  }

  const cartao = await prisma.cartaoDigital.findUnique({
    where: { codigo: dados.data.codigo.trim() },
    include: {
      subscricao: {
        include: { cliente: true, pacote: true, estacao: true },
      },
    },
  });

  if (!cartao) {
    return NextResponse.json({ valido: false, motivo: "Código não encontrado." });
  }

  const { subscricao } = cartao;

  if (subscricao.estado !== "ativa") {
    return NextResponse.json({
      valido: false,
      motivo: "A subscrição deste cliente não está ativa.",
      cliente: { nome: subscricao.cliente.nome },
    });
  }

  if (cartao.validade < new Date()) {
    return NextResponse.json({
      valido: false,
      motivo: "O cartão deste cliente expirou.",
      cliente: { nome: subscricao.cliente.nome },
    });
  }

  if (subscricao.ambitoUso === "estacao_unica" && subscricao.estacaoId !== session.user.estacaoId) {
    return NextResponse.json({
      valido: false,
      motivo: `Este cartão só é válido em: ${subscricao.estacao?.nome ?? "estação selecionada"}.`,
      cliente: { nome: subscricao.cliente.nome },
    });
  }

  const lavagensUsadasMes = await prisma.lavagem.count({
    where: { subscricaoId: subscricao.id, dataHora: { gte: inicioDoMes() } },
  });

  const ilimitado = subscricao.pacote.lavagensMes === 0;
  if (!ilimitado && lavagensUsadasMes >= subscricao.pacote.lavagensMes) {
    return NextResponse.json({
      valido: false,
      motivo: `Limite de ${subscricao.pacote.lavagensMes} lavagens do pacote ${subscricao.pacote.nome} já foi atingido este mês.`,
      cliente: { nome: subscricao.cliente.nome },
    });
  }

  return NextResponse.json({
    valido: true,
    subscricaoId: subscricao.id,
    cliente: { nome: subscricao.cliente.nome, email: subscricao.cliente.email },
    pacote: { nome: subscricao.pacote.nome, lavagensMes: subscricao.pacote.lavagensMes },
    lavagensUsadasMes,
    lavagensRestantes: ilimitado ? null : subscricao.pacote.lavagensMes - lavagensUsadasMes,
  });
}
