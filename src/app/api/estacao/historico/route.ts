import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Últimas lavagens registadas na estação do operador autenticado (contexto/auditoria). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "operador" || !session.user.estacaoId) {
    return NextResponse.json({ erro: "É preciso iniciar sessão como operador de estação." }, { status: 401 });
  }

  const lavagens = await prisma.lavagem.findMany({
    where: { estacaoId: session.user.estacaoId },
    include: { cliente: true },
    orderBy: { dataHora: "desc" },
    take: 20,
  });

  return NextResponse.json(lavagens);
}
