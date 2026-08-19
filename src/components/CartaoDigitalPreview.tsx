"use client";

import Image from "next/image";
import { Button } from "./Button";

export type CartaoDados = {
  subscricaoId: string;
  codigo: string;
  qrDataUrl: string;
  nomeCliente: string;
  pacoteNome: string;
  estacaoNome?: string | null;
  ambitoUso: string;
  validade: string;
};

/**
 * Processo 1, Passo 7-8 / Processo 2, Passo 4-5 — cartão digital do cliente,
 * com QR code, pronto a mostrar na estação e a descarregar em PDF.
 */
export function CartaoDigitalPreview({ cartao }: { cartao: CartaoDados }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-kipupu-gradient rounded-lg p-6 text-white shadow-kipupu">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-heading font-bold text-2xl">KIPUPU</p>
            <p className="text-xs text-white/70">A plataforma que lava o seu carro</p>
          </div>
          <Image src="/brand/logos/logo-mark-light.svg" alt="" width={40} height={38} />
        </div>

        <div className="mt-6">
          <p className="font-heading font-bold text-lg">{cartao.nomeCliente}</p>
          <p className="text-sm">Pacote {cartao.pacoteNome}</p>
          <p className="text-sm text-white/80">
            {cartao.ambitoUso === "estacao_unica" && cartao.estacaoNome
              ? `Válido em: ${cartao.estacaoNome}`
              : "Válido em qualquer estação parceira"}
          </p>
          <p className="text-xs text-kipupu-cyan mt-2">{cartao.codigo}</p>
          <p className="text-xs text-white/60">
            Válido até {new Date(cartao.validade).toLocaleDateString("pt-PT")}
          </p>
        </div>

        <div className="mt-6 bg-white rounded-md p-3 w-fit mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cartao.qrDataUrl} alt="QR code do cartão" width={160} height={160} />
        </div>
      </div>

      <a
        href={`/api/cartao/${cartao.subscricaoId}?formato=pdf`}
        className="block mt-4"
      >
        <Button className="w-full">Descarregar cartão em PDF</Button>
      </a>

      <p className="text-xs text-kipupu-gray900/50 text-center mt-3">
        Apresenta este cartão (ou o PDF) na estação. A estação lê o código QR para confirmar a
        tua subscrição e procede à lavagem.
      </p>
    </div>
  );
}
