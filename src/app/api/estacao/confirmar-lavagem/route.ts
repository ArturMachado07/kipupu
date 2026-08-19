import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const confirmarSchema = z.object({ subscricaoId: z.string().min(1) });

/** Regista a lavagem depois de o operador confirmar visualmente os dados do cliente. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "operador" || !session.user.estacaoId) {
    return NextResponse.json({ erro: "É preciso iniciar sessão como operador de estação." }, { status: 401 });
  }

  const corpo = await req.json();
  const dados = confirmarSchema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const subscricao = await prisma.subscricao.findUnique({
    where: { id: dados.data.subscricaoId },
    include: { cliente: true },
  });

  if (!subscricao || subscricao.estado !== "ativa") {
    return NextResponse.json({ erro: "Subscrição inválida." }, { status: 404 });
  }

  const lavagem = await prisma.lavagem.create({
    data: {
      clienteId: subscricao.clienteId,
      estacaoId: session.user.estacaoId,
      subscricaoId: subscricao.id,
    },
  });

  return NextResponse.json({ ok: true, lavagem });
}
