import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Processo 1, Passo 3 — lista de estações de um distrito (mapa do Distrito Urbano). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const estacoes = await prisma.estacao.findMany({
    where: { distritoId: params.id, ativa: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(estacoes);
}
