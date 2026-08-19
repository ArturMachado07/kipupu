import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criarEstacaoAdminSchema } from "@/lib/validation";
import { gerarPasswordAleatoria } from "@/lib/senha";

async function exigirAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return null;
  }
  return session;
}

/** Lista todas as estações (ativas e inativas) para o painel /admin/estacoes. */
export async function GET() {
  const session = await exigirAdmin();
  if (!session) {
    return NextResponse.json({ erro: "Acesso restrito à administração." }, { status: 401 });
  }

  const estacoes = await prisma.estacao.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      distrito: { include: { municipio: true } },
      operadores: { select: { id: true, nome: true, email: true, ativo: true } },
      _count: { select: { subscricoes: true, lavagens: true } },
    },
  });

  return NextResponse.json(estacoes);
}

/**
 * Cria uma estação parceira real + a conta de operador que a acompanha.
 * É a versão em página web do script `prisma/add-estacao.ts` — mesma lógica,
 * mas pensada para quem prefere um formulário a usar o Terminal.
 */
export async function POST(req: Request) {
  const session = await exigirAdmin();
  if (!session) {
    return NextResponse.json({ erro: "Acesso restrito à administração." }, { status: 401 });
  }

  const corpo = await req.json().catch(() => null);
  const dados = criarEstacaoAdminSchema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const {
    municipio: nomeMunicipio,
    distrito: nomeDistrito,
    nome,
    morada,
    latitude,
    longitude,
    horario,
    telefone,
    capacidade,
    operadorNome,
    operadorEmail,
    operadorPassword,
  } = dados.data;

  const emailNormalizado = operadorEmail.toLowerCase().trim();

  const operadorExistente = await prisma.operadorEstacao.findUnique({
    where: { email: emailNormalizado },
  });
  if (operadorExistente) {
    return NextResponse.json(
      { erro: `Já existe um operador com o email "${emailNormalizado}".` },
      { status: 409 }
    );
  }

  const municipio = await prisma.municipio.upsert({
    where: { nome: nomeMunicipio },
    update: {},
    create: { nome: nomeMunicipio },
  });

  const distrito = await prisma.distrito.upsert({
    where: { municipioId_nome: { municipioId: municipio.id, nome: nomeDistrito } },
    update: {},
    create: { nome: nomeDistrito, municipioId: municipio.id },
  });

  const estacao = await prisma.estacao.create({
    data: {
      nome,
      morada,
      distritoId: distrito.id,
      latitude,
      longitude,
      horario,
      telefone: telefone || null,
      capacidade,
      ativa: true,
    },
  });

  const passwordFinal = operadorPassword || gerarPasswordAleatoria();
  const passwordHash = await bcrypt.hash(passwordFinal, 10);

  const operador = await prisma.operadorEstacao.create({
    data: {
      nome: operadorNome,
      email: emailNormalizado,
      passwordHash,
      estacaoId: estacao.id,
    },
  });

  return NextResponse.json({
    estacao: { id: estacao.id, nome: estacao.nome },
    operador: { id: operador.id, nome: operador.nome, email: operador.email },
    // Só devolvida nesta resposta, imediatamente após a criação — não fica
    // guardada em lado nenhum a partir daqui, tal como a password de qualquer conta.
    passwordGerada: passwordFinal,
  });
}
