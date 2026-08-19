import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criarSubscricaoSchema } from "@/lib/validation";

/**
 * Cria uma subscrição em estado "pendente" — usada tanto no Processo 1
 * (estação já escolhida) como no Processo 2 (estação pode vir depois).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "É preciso iniciar sessão." }, { status: 401 });
  }

  const corpo = await req.json();
  const dados = criarSubscricaoSchema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: dados.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const subscricao = await prisma.subscricao.create({
    data: {
      clienteId: session.user.id,
      pacoteId: dados.data.pacoteId,
      estacaoId: dados.data.estacaoId ?? null,
      ambitoUso: dados.data.ambitoUso,
      estado: "pendente",
    },
    include: { pacote: true, estacao: true },
  });

  return NextResponse.json(subscricao, { status: 201 });
}

/** Lista as subscrições do cliente autenticado. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "É preciso iniciar sessão." }, { status: 401 });
  }

  const subscricoes = await prisma.subscricao.findMany({
    where: { clienteId: session.user.id },
    include: { pacote: true, estacao: true, cartao: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(subscricoes);
}
