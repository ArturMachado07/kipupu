import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Passo "Selecionar Pacote" — 3 opções: básico, intermédio, premium. */
export async function GET() {
  const pacotes = await prisma.pacote.findMany({ orderBy: { ordem: "asc" } });
  return NextResponse.json(pacotes);
}
