"use client";

import { Button } from "./Button";

export type Pacote = {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  precoMensal: number;
  beneficios: string;
};

/** Passo "Selecionar Pacote" — 3 opções: básico, intermédio, premium. */
export function PopupPacotes({
  pacotes,
  onEscolher,
  onFechar,
}: {
  pacotes: Pacote[];
  onEscolher: (pacote: Pacote) => void;
  onFechar: () => void;
}) {
  return (
    <div className="kipupu-overlay" onClick={onFechar}>
      <div className="kipupu-modal max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="font-heading font-bold text-2xl text-kipupu-navy text-center">
            Escolhe o teu pacote
          </h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {pacotes.map((p) => (
              <div
                key={p.id}
                className={`border rounded-md p-4 flex flex-col ${
                  p.slug === "intermedio" ? "border-kipupu-cyan ring-2 ring-kipupu-cyan" : "border-kipupu-gray100"
                }`}
              >
                <h3 className="font-heading font-bold text-kipupu-navy">{p.nome}</h3>
                <p className="text-xs text-kipupu-gray900/60 mt-1">{p.descricao}</p>
                <div className="mt-3 text-2xl font-heading font-bold text-kipupu-navy">
                  {p.precoMensal.toLocaleString("pt-PT")} Kz
                  <span className="text-xs font-body font-normal text-kipupu-gray900/50">/mês</span>
                </div>
                <ul className="mt-3 space-y-1 text-xs flex-1">
                  {p.beneficios.split("|").map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
                <Button onClick={() => onEscolher(p)} className="mt-4 w-full">
                  Selecionar
                </Button>
              </div>
            ))}
          </div>
          <Button variant="ghost" onClick={onFechar} className="w-full mt-4">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
