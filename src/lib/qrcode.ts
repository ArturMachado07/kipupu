import QRCode from "qrcode";
import { randomBytes } from "crypto";

/**
 * Gera um código único para o cartão digital (embutido no QR) e o respetivo
 * QR code como data URL PNG (pronto a usar em <img src="..."> ou no PDF).
 */
export function gerarCodigoCartao(subscricaoId: string): string {
  const sufixo = randomBytes(4).toString("hex").toUpperCase();
  return `KIPUPU-${subscricaoId.slice(-6).toUpperCase()}-${sufixo}`;
}

export async function gerarQrDataUrl(codigo: string): Promise<string> {
  // O conteúdo do QR é o código único; a estação lê e valida contra a base de dados.
  return QRCode.toDataURL(codigo, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: {
      dark: "#003A5D",
      light: "#FFFFFF",
    },
  });
}
