import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ordenarPorProximidade } from "@/lib/geo";

/**
 * Lista todas as estações ativas. Se `lat`/`lng` forem passados na query,
 * devolve ordenado por proximidade — usado no Processo 2, Passo 3
 * ("Localizar Estação": sugerir a mais próxima da localização do cliente).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const estacoes = await prisma.estacao.findMany({
    where: { ativa: true },
    include: { distrito: { include: { municipio: true } } },
  });

  if (lat && lng) {
    const origem = { latitude: Number(lat), longitude: Number(lng) };
    const ordenadas = ordenarPorProximidade(origem, estacoes);
    return NextResponse.json(ordenadas);
  }

  return NextResponse.json(estacoes);
}
