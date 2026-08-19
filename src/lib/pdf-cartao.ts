import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const NAVY = rgb(0 / 255, 58 / 255, 93 / 255);
const CYAN = rgb(39 / 255, 255 / 255, 247 / 255);
const WHITE = rgb(1, 1, 1);

export type DadosCartao = {
  nomeCliente: string;
  pacoteNome: string;
  estacaoNome: string | null;
  ambitoUso: "estacao_unica" | "rede_aberta" | string;
  codigo: string;
  qrDataUrl: string; // data:image/png;base64,...
  validade: Date;
};

/** Gera o PDF do cartão digital (Processo 1, Passo 7 / Processo 2, Passo 4). */
export async function gerarPdfCartao(dados: DadosCartao): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  // Formato tipo cartão, paisagem (aprox. cartão de crédito ampliado, em pontos PDF)
  const page = pdf.addPage([540, 340]);

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  // Fundo gradiente institucional (aproximado por dois blocos, pdf-lib não faz gradiente nativo)
  page.drawRectangle({ x: 0, y: 0, width: 540, height: 340, color: NAVY });
  page.drawRectangle({ x: 340, y: 0, width: 200, height: 340, color: NAVY, opacity: 0.9 });

  page.drawText("KIPUPU", {
    x: 30,
    y: 290,
    size: 28,
    font: fontBold,
    color: WHITE,
  });
  page.drawText("A plataforma que lava o seu carro", {
    x: 30,
    y: 270,
    size: 9,
    font: fontRegular,
    color: CYAN,
  });

  page.drawText(dados.nomeCliente, {
    x: 30,
    y: 210,
    size: 16,
    font: fontBold,
    color: WHITE,
  });

  page.drawText(`Pacote: ${dados.pacoteNome}`, {
    x: 30,
    y: 185,
    size: 11,
    font: fontRegular,
    color: WHITE,
  });

  const textoAmbito =
    dados.ambitoUso === "estacao_unica" && dados.estacaoNome
      ? `Válido em: ${dados.estacaoNome}`
      : "Válido em qualquer estação parceira KIPUPU";
  page.drawText(textoAmbito, {
    x: 30,
    y: 168,
    size: 11,
    font: fontRegular,
    color: WHITE,
  });

  page.drawText(`Código: ${dados.codigo}`, {
    x: 30,
    y: 145,
    size: 10,
    font: fontRegular,
    color: CYAN,
  });

  page.drawText(
    `Válido até: ${dados.validade.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`,
    { x: 30, y: 128, size: 10, font: fontRegular, color: WHITE }
  );

  // QR code
  const qrBase64 = dados.qrDataUrl.split(",")[1];
  const qrBytes = Uint8Array.from(Buffer.from(qrBase64, "base64"));
  const qrImage = await pdf.embedPng(qrBytes);
  const qrSize = 150;
  page.drawImage(qrImage, {
    x: 540 - qrSize - 30,
    y: 340 / 2 - qrSize / 2,
    width: qrSize,
    height: qrSize,
  });

  return pdf.save();
}
