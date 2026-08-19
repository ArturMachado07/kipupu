import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function inicioDoDia(offsetDias = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDias);
  return d;
}

function inicioDaSemana(): Date {
  const d = inicioDoDia();
  const diaSemana = d.getDay(); // 0 (domingo) .. 6 (sábado)
  const offset = diaSemana === 0 ? 6 : diaSemana - 1; // semana começa à segunda-feira
  d.setDate(d.getDate() - offset);
  return d;
}

function inicioDoMes(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

/**
 * Estatísticas de uso da estação do operador autenticado — usadas na página
 * /estacao/estatisticas (dashboard simples: totais + gráfico dos últimos 14
 * dias). Baseado em número de lavagens, não em valores monetários: o
 * pagamento é feito à KIPUPU centralmente (a subscrição), a estação não
 * recebe pagamentos diretamente — ver nota no README sobre a divisão de
 * receita entre estações, que ainda é uma decisão de negócio em aberto.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "operador" || !session.user.estacaoId) {
    return NextResponse.json({ erro: "É preciso iniciar sessão como operador de estação." }, { status: 401 });
  }

  const estacaoId = session.user.estacaoId;

  const [hoje, semana, mes, total] = await Promise.all([
    prisma.lavagem.count({ where: { estacaoId, dataHora: { gte: inicioDoDia() } } }),
    prisma.lavagem.count({ where: { estacaoId, dataHora: { gte: inicioDaSemana() } } }),
    prisma.lavagem.count({ where: { estacaoId, dataHora: { gte: inicioDoMes() } } }),
    prisma.lavagem.count({ where: { estacaoId } }),
  ]);

  const desde = inicioDoDia(13);
  const lavagensRecentes = await prisma.lavagem.findMany({
    where: { estacaoId, dataHora: { gte: desde } },
    select: { dataHora: true },
  });

  const porDia = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    porDia.set(inicioDoDia(i).toISOString().slice(0, 10), 0);
  }
  for (const lavagem of lavagensRecentes) {
    const chave = new Date(lavagem.dataHora).toISOString().slice(0, 10);
    if (porDia.has(chave)) porDia.set(chave, (porDia.get(chave) ?? 0) + 1);
  }

  const clientesDistintos = await prisma.lavagem.findMany({
    where: { estacaoId },
    select: { clienteId: true },
    distinct: ["clienteId"],
  });

  return NextResponse.json({
    hoje,
    semana,
    mes,
    total,
    clientesUnicos: clientesDistintos.length,
    porDia: Array.from(porDia.entries()).map(([data, quantidade]) => ({ data, quantidade })),
  });
}
