import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const NAVY = rgb(0 / 255, 58 / 255, 93 / 255);
const GRAY = rgb(51 / 255, 51 / 255, 51 / 255);

export type DadosFatura = {
  numeroFatura: string;
  nomeCliente: string;
  emailCliente: string;
  pacoteNome: string;
  valor: number; // AOA
  metodo: "referencia" | "transferencia" | string;
  referencia?: string | null;
  data: Date;
};

function formatarKz(valor: number): string {
  return `${valor.toLocaleString("pt-PT")} Kz`;
}

/** Gera a fatura em PDF do pagamento (Processo 1, Passo 6). */
export async function gerarPdfFatura(dados: DadosFatura): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 780;

  page.drawText("KIPUPU", { x: 40, y, size: 26, font: fontBold, color: NAVY });
  y -= 20;
  page.drawText("Húmuos Grupo — Fintech Angolana", {
    x: 40,
    y,
    size: 9,
    font: fontRegular,
    color: GRAY,
  });

  y -= 40;
  page.drawText("Fatura de Subscrição", { x: 40, y, size: 16, font: fontBold, color: NAVY });

  y -= 30;
  const linhas: [string, string][] = [
    ["Nº da fatura", dados.numeroFatura],
    ["Data", dados.data.toLocaleDateString("pt-PT")],
    ["Cliente", dados.nomeCliente],
    ["Email", dados.emailCliente],
    ["Pacote", dados.pacoteNome],
    ["Método de pagamento", dados.metodo === "referencia" ? "Referência Multicaixa" : "Transferência bancária"],
  ];
  if (dados.referencia) {
    linhas.push(["Referência", dados.referencia]);
  }

  for (const [label, valor] of linhas) {
    page.drawText(`${label}:`, { x: 40, y, size: 11, font: fontBold, color: GRAY });
    page.drawText(valor, { x: 200, y, size: 11, font: fontRegular, color: GRAY });
    y -= 20;
  }

  y -= 20;
  page.drawRectangle({ x: 40, y: y - 10, width: 515, height: 1, color: NAVY });
  y -= 40;

  page.drawText("Total a pagar", { x: 40, y, size: 13, font: fontBold, color: NAVY });
  page.drawText(formatarKz(dados.valor), { x: 450, y, size: 13, font: fontBold, color: NAVY });

  y -= 60;
  page.drawText(
    "Este documento serve como comprovativo de pagamento da subscrição mensal KIPUPU.",
    { x: 40, y, size: 9, font: fontRegular, color: GRAY }
  );

  return pdf.save();
}
