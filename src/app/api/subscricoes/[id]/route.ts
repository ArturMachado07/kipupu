import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const atualizarSchema = z.object({
  estacaoId: z.string().min(1).optional(),
  ambitoUso: z.enum(["estacao_unica", "rede_aberta"]).optional(),
});

/**
 * Processo 2, Passo 3 — guarda a estação mais próxima escolhida pelo cliente
 * (estação preferida), sem bloquear a validade do cartão nas restantes.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "É preciso iniciar sessão." }, { status: 401 });
  }

  const corpo = await req.json();
  const dados = atualizarSchema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });
  }

  const subscricao = await prisma.subscricao.findUnique({ where: { id: params.id } });
  if (!subscricao || subscricao.clienteId !== session.user.id) {
    return NextResponse.json({ erro: "Subscrição não encontrada." }, { status: 404 });
  }

  const atualizada = await prisma.subscricao.update({
    where: { id: params.id },
    data: dados.data,
    include: { pacote: true, estacao: true, cartao: true },
  });

  return NextResponse.json(atualizada);
}
