import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registoSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const corpo = await req.json();
  const dados = registoSchema.safeParse(corpo);

  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const emailNormalizado = dados.data.email.toLowerCase().trim();

  const existente = await prisma.cliente.findUnique({ where: { email: emailNormalizado } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe uma conta com este email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(dados.data.password, 10);

  const cliente = await prisma.cliente.create({
    data: {
      nome: dados.data.nome,
      email: emailNormalizado,
      passwordHash,
      whatsapp: dados.data.whatsapp || null,
    },
  });

  return NextResponse.json({ id: cliente.id, nome: cliente.nome, email: cliente.email }, { status: 201 });
}
