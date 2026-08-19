import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const atualizarSchema = z.object({ ativa: z.boolean() });

/** Ativar/desativar uma estação (ex.: parceria suspensa temporariamente). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ erro: "Acesso restrito à administração." }, { status: 401 });
  }

  const corpo = await req.json().catch(() => null);
  const dados = atualizarSchema.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const estacao = await prisma.estacao.update({
    where: { id: params.id },
    data: { ativa: dados.data.ativa },
  });

  return NextResponse.json({ id: estacao.id, ativa: estacao.ativa });
}
