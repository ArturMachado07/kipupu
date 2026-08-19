import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gerarPdfCartao } from "@/lib/pdf-cartao";

/**
 * Processo 1, Passo 7 / Processo 2, Passo 4 — devolve os dados do cartão
 * digital. Passa `?formato=pdf` para descarregar o cartão em PDF.
 */
export async function GET(req: Request, { params }: { params: { subscricaoId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "É preciso iniciar sessão." }, { status: 401 });
  }

  const subscricao = await prisma.subscricao.findUnique({
    where: { id: params.subscricaoId },
    include: { pacote: true, estacao: true, cartao: true, cliente: true },
  });

  if (!subscricao || subscricao.clienteId !== session.user.id) {
    return NextResponse.json({ erro: "Subscrição não encontrada." }, { status: 404 });
  }

  if (!subscricao.cartao) {
    return NextResponse.json(
      { erro: "Cartão ainda não gerado — o pagamento precisa de ser confirmado primeiro." },
      { status: 409 }
    );
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get("formato") === "pdf") {
    const pdfBytes = await gerarPdfCartao({
      nomeCliente: subscricao.cliente.nome,
      pacoteNome: subscricao.pacote.nome,
      estacaoNome: subscricao.estacao?.nome ?? null,
      ambitoUso: subscricao.ambitoUso,
      codigo: subscricao.cartao.codigo,
      qrDataUrl: subscricao.cartao.qrDataUrl,
      validade: subscricao.cartao.validade,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cartao-kipupu-${subscricao.cartao.codigo}.pdf"`,
      },
    });
  }

  return NextResponse.json(subscricao);
}
