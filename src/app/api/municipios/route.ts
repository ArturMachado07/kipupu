import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Processo 1, Passo 1 — lista de municípios (mapa da Província de Luanda). */
export async function GET() {
  const municipios = await prisma.municipio.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { distritos: true } } },
  });
  return NextResponse.json(municipios);
}
