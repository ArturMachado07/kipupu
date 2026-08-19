import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Processo 1, Passo 2 — lista de distritos de um município (mapa do Município). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const distritos = await prisma.distrito.findMany({
    where: { municipioId: params.id },
    orderBy: { nome: "asc" },
    include: { _count: { select: { estacoes: true } } },
  });
  return NextResponse.json(distritos);
}
