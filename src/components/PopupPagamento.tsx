"use client";

import { useState } from "react";
import { Button } from "./Button";

type Metodo = "referencia" | "transferencia";

type PagamentoCriado = {
  id: string;
  referencia?: string | null;
  dadosTransferencia?: { iban: string; banco: string; titular: string } | null;
};

/** Processo 1, Passo 6 — opções de pagamento e geração da fatura em PDF. */
export function PopupPagamento({
  subscricaoId,
  valor,
  onConcluido,
  onFechar,
}: {
  subscricaoId: string;
  valor: number;
  onConcluido: () => void;
  onFechar: () => void;
}) {
  const [metodo, setMetodo] = useState<Metodo | null>(null);
  const [pagamento, setPagamento] = useState<PagamentoCriado | null>(null);
  const [aProcessar, setAProcessar] = useState(false);
  const [aConfirmar, setAConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolherMetodo(m: Metodo) {
    setMetodo(m);
    setErro(null);
    setAProcessar(true);
    try {
      const resp = await fetch("/api/pagamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscricaoId, metodo: m }),
      });
      if (!resp.ok) throw new Error();
      const dados = await resp.json();
      setPagamento(dados);
    } catch {
      setErro("Não foi possível gerar o pagamento. Tenta novamente.");
    } finally {
      setAProcessar(false);
    }
  }

  async function confirmarPagamento() {
    if (!pagamento) return;
    setAConfirmar(true);
    setErro(null);
    try {
      const resp = await fetch(`/api/pagamentos/${pagamento.id}/confirmar`, { method: "PATCH" });
      if (!resp.ok) throw new Error();
      onConcluido();
    } catch {
      setErro("Não foi possível confirmar o pagamento.");
    } finally {
      setAConfirmar(false);
    }
  }

  return (
    <div className="kipupu-overlay" onClick={onFechar}>
      <div className="kipupu-modal" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="font-heading font-bold text-2xl text-kipupu-navy">Pagamento</h2>
          <p className="text-sm text-kipupu-gray900/70 mt-1">
            Total a pagar: <strong>{valor.toLocaleString("pt-PT")} Kz</strong>
          </p>

          {!metodo && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => escolherMetodo("referencia")}>
                Referência Multicaixa
              </Button>
              <Button variant="ghost" onClick={() => escolherMetodo("transferencia")}>
                Transferência bancária
              </Button>
            </div>
          )}

          {aProcessar && <p className="mt-4 text-sm text-kipupu-gray900/60">A gerar pagamento...</p>}

          {pagamento && metodo === "referencia" && (
            <div className="mt-6 bg-kipupu-gray100 rounded-md p-4 text-sm space-y-1">
              <p className="font-bold text-kipupu-navy">Paga em qualquer ATM ou Multicaixa Express:</p>
              <p>Entidade: <strong>{pagamento.referencia?.split("|")[0]}</strong></p>
              <p>Referência: <strong>{pagamento.referencia?.split("|")[1]}</strong></p>
              <p>Valor: <strong>{valor.toLocaleString("pt-PT")} Kz</strong></p>
            </div>
          )}

          {pagamento && metodo === "transferencia" && pagamento.dadosTransferencia && (
            <div className="mt-6 bg-kipupu-gray100 rounded-md p-4 text-sm space-y-1">
              <p className="font-bold text-kipupu-navy">Transfere para a conta KIPUPU:</p>
              <p>IBAN: <strong>{pagamento.dadosTransferencia.iban}</strong></p>
              <p>Banco: <strong>{pagamento.dadosTransferencia.banco}</strong></p>
              <p>Titular: <strong>{pagamento.dadosTransferencia.titular}</strong></p>
            </div>
          )}

          {pagamento && (
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={`/api/pagamentos/${pagamento.id}/fatura`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-kipupu-blue text-sm underline text-center"
              >
                Ver / descarregar fatura em PDF
              </a>
              <Button onClick={confirmarPagamento} disabled={aConfirmar}>
                {aConfirmar ? "A confirmar..." : "Já paguei — confirmar pagamento"}
              </Button>
              <p className="text-xs text-kipupu-gray900/40 text-center">
                Em produção, esta confirmação chega automaticamente da EMIS (referência) ou da
                conciliação bancária (transferência). Aqui simula-se a confirmação para testar o fluxo.
              </p>
            </div>
          )}

          {erro && <p className="text-red-600 text-sm mt-3">{erro}</p>}

          <Button variant="ghost" onClick={onFechar} className="w-full mt-4">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
