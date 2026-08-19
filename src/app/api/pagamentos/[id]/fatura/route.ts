import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gerarPdfFatura } from "@/lib/pdf-fatura";

/** Processo 1, Passo 6 — geração/descarga da fatura em PDF. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "É preciso iniciar sessão." }, { status: 401 });
  }

  const pagamento = await prisma.pagamento.findUnique({
    where: { id: params.id },
    include: { cliente: true, subscricao: { include: { pacote: true } } },
  });

  if (!pagamento || pagamento.clienteId !== session.user.id) {
    return NextResponse.json({ erro: "Pagamento não encontrado." }, { status: 404 });
  }

  const pdfBytes = await gerarPdfFatura({
    numeroFatura: `FT-${pagamento.id.slice(-8).toUpperCase()}`,
    nomeCliente: pagamento.cliente.nome,
    emailCliente: pagamento.cliente.email,
    pacoteNome: pagamento.subscricao.pacote.nome,
    valor: pagamento.valor,
    metodo: pagamento.metodo,
    referencia: pagamento.referencia,
    data: pagamento.createdAt,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="fatura-kipupu-${pagamento.id.slice(-8)}.pdf"`,
    },
  });
}
