import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criarPagamentoSchema } from "@/lib/validation";
import { gerarReferenciaPagamento } from "@/lib/referencia";

/**
 * Processo 1, Passo 6 / Processo 2, Passo 1-2 — regista o pagamento
 * (referência Multicaixa ou transferência) associado a uma subscrição.
 *
 * Nota de integração: a confirmação real deve vir de um webhook da EMIS
 * (referência) ou de conciliação manual/bancária (transferência). Por agora
 * expomos PATCH /api/pagamentos/[id]/confirmar para simular essa confirmação.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "É preciso iniciar sessão." }, { status: 401 });
  }

  const corpo = await req.json();
  const dados = criarPagamentoSchema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: dados.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const subscricao = await prisma.subscricao.findUnique({
    where: { id: dados.data.subscricaoId },
    include: { pacote: true },
  });

  if (!subscricao || subscricao.clienteId !== session.user.id) {
    return NextResponse.json({ erro: "Subscrição não encontrada." }, { status: 404 });
  }

  const referenciaGerada =
    dados.data.metodo === "referencia" ? gerarReferenciaPagamento() : null;

  const pagamento = await prisma.pagamento.create({
    data: {
      subscricaoId: subscricao.id,
      clienteId: session.user.id,
      metodo: dados.data.metodo,
      valor: subscricao.pacote.precoMensal,
      referencia: referenciaGerada
        ? `${referenciaGerada.entidade}|${referenciaGerada.referencia}`
        : null,
      estado: "pendente",
    },
  });

  return NextResponse.json({
    ...pagamento,
    dadosTransferencia:
      dados.data.metodo === "transferencia"
        ? {
            iban: process.env.KIPUPU_IBAN ?? "AO06 0000 0000 0000 0000 0000 0",
            banco: process.env.KIPUPU_BANCO ?? "Nome do Banco",
            titular: process.env.KIPUPU_TITULAR ?? "Húmuos Grupo, Lda",
          }
        : null,
  }, { status: 201 });
}
