"use client";

import { Button } from "./Button";

export type EstacaoDetalhe = {
  id: string;
  nome: string;
  morada: string;
  horario: string;
  telefone?: string | null;
  capacidade: number;
  distanciaKm?: number;
};

/** Processo 1, Passo 4 — pop-up com os detalhes da estação selecionada. */
export function PopupDetalhesEstacao({
  estacao,
  onConfirmar,
  onVoltar,
}: {
  estacao: EstacaoDetalhe;
  onConfirmar: () => void;
  onVoltar: () => void;
}) {
  return (
    <div className="kipupu-overlay" onClick={onVoltar}>
      <div className="kipupu-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bg-kipupu-gradient text-white p-6 rounded-t-lg">
          <span className="text-xs uppercase tracking-wide text-white/70">Estação selecionada</span>
          <h2 className="font-heading font-bold text-2xl mt-1">{estacao.nome}</h2>
        </div>
        <div className="p-6 space-y-3">
          <Linha label="Morada" valor={estacao.morada} />
          <Linha label="Horário" valor={estacao.horario} />
          {estacao.telefone && <Linha label="Contacto" valor={estacao.telefone} />}
          <Linha label="Baias disponíveis" valor={String(estacao.capacidade)} />
          {typeof estacao.distanciaKm === "number" && (
            <Linha label="Distância" valor={`${estacao.distanciaKm.toFixed(1)} km`} />
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={onVoltar} className="flex-1">
              Voltar
            </Button>
            <Button onClick={onConfirmar} className="flex-1">
              Escolher esta estação
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between text-sm border-b border-kipupu-gray100 pb-2">
      <span className="text-kipupu-gray900/60">{label}</span>
      <span className="font-bold text-kipupu-navy text-right">{valor}</span>
    </div>
  );
}
