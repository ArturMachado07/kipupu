import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gerarCodigoCartao, gerarQrDataUrl } from "@/lib/qrcode";
import { enviarWhatsAppAcesso } from "@/lib/whatsapp";

/**
 * Confirma o pagamento (Processo 1, Passo 6 / Processo 2, Passo 2).
 *
 * Em produção isto é chamado por um webhook (EMIS, para referência) ou por
 * conciliação manual (transferência bancária). Aqui simulamos a confirmação
 * imediata para permitir testar o fluxo ponta a ponta.
 *
 * Ao confirmar:
 *  - ativa a subscrição;
 *  - gera o cartão digital com QR code (Passo 7 / Passo 4);
 *  - envia (stub) o acesso e o link do mapa via WhatsApp (Processo 2, Passo 2).
 */
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ erro: "É preciso iniciar sessão." }, { status: 401 });
  }

  const pagamento = await prisma.pagamento.findUnique({
    where: { id: params.id },
    include: { subscricao: { include: { pacote: true, estacao: true } }, cliente: true },
  });

  if (!pagamento || pagamento.clienteId !== session.user.id) {
    return NextResponse.json({ erro: "Pagamento não encontrado." }, { status: 404 });
  }

  if (pagamento.estado === "confirmado") {
    return NextResponse.json({ erro: "Pagamento já confirmado." }, { status: 409 });
  }

  const agora = new Date();
  const validade = new Date(agora);
  validade.setMonth(validade.getMonth() + 1);

  await prisma.pagamento.update({
    where: { id: pagamento.id },
    data: { estado: "confirmado", confirmadoEm: agora },
  });

  const subscricaoAtiva = await prisma.subscricao.update({
    where: { id: pagamento.subscricaoId },
    data: { estado: "ativa", dataInicio: agora, dataRenovacao: validade },
    include: { pacote: true, estacao: true },
  });

  // Gera o cartão digital (idempotente: se já existir, reutiliza).
  let cartao = await prisma.cartaoDigital.findUnique({ where: { subscricaoId: subscricaoAtiva.id } });
  if (!cartao) {
    const codigo = gerarCodigoCartao(subscricaoAtiva.id);
    const qrDataUrl = await gerarQrDataUrl(codigo);
    cartao = await prisma.cartaoDigital.create({
      data: {
        subscricaoId: subscricaoAtiva.id,
        codigo,
        qrDataUrl,
        validade,
      },
    });
  }

  // Processo 2, Passo 2: envia acesso + link do mapa via WhatsApp (stub).
  if (pagamento.cliente.whatsapp) {
    await enviarWhatsAppAcesso({
      numeroWhatsapp: pagamento.cliente.whatsapp,
      nomeCliente: pagamento.cliente.nome,
      linkMapa: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard`,
    });
  }

  return NextResponse.json({ subscricao: subscricaoAtiva, cartao });
}
