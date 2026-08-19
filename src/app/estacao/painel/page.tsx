"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { LeitorQr } from "@/components/LeitorQr";

type Validacao = {
  valido: boolean;
  motivo?: string;
  subscricaoId?: string;
  cliente?: { nome: string; email?: string };
  pacote?: { nome: string; lavagensMes: number };
  lavagensUsadasMes?: number;
  lavagensRestantes?: number | null;
};

type LavagemHistorico = {
  id: string;
  dataHora: string;
  cliente: { nome: string };
};

export default function PainelEstacaoPage() {
  const { data: session } = useSession();
  const [codigoManual, setCodigoManual] = useState("");
  const [aValidar, setAValidar] = useState(false);
  const [validacao, setValidacao] = useState<Validacao | null>(null);
  const [aConfirmar, setAConfirmar] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [historico, setHistorico] = useState<LavagemHistorico[]>([]);

  const carregarHistorico = useCallback(async () => {
    const resp = await fetch("/api/estacao/historico");
    if (resp.ok) setHistorico(await resp.json());
  }, []);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  async function validarCodigo(codigo: string) {
    if (!codigo.trim()) return;
    setAValidar(true);
    setValidacao(null);
    setConfirmado(false);
    try {
      const resp = await fetch("/api/estacao/validar-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigo.trim() }),
      });

      // A sessão de operador é partilhada com o resto do site (mesmo browser).
      // Se entretanto tiver sido feito login como cliente ou admin noutro
      // separador, este pedido chega sem sessão de operador válida — mostra
      // uma mensagem clara em vez de ficar em branco.
      if (resp.status === 401) {
        setValidacao({
          valido: false,
          motivo:
            "A tua sessão de operador expirou ou foi substituída (por ex. login como cliente noutro separador). Sai e volta a entrar em /estacao/login.",
        });
        return;
      }

      const dados = await resp.json();
      setValidacao({ motivo: "Não foi possível validar o cartão.", ...dados });
    } catch {
      setValidacao({ valido: false, motivo: "Erro de rede ao validar o cartão." });
    } finally {
      setAValidar(false);
    }
  }

  async function confirmarLavagem() {
    if (!validacao?.subscricaoId) return;
    setAConfirmar(true);
    try {
      const resp = await fetch("/api/estacao/confirmar-lavagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscricaoId: validacao.subscricaoId }),
      });
      if (resp.ok) {
        setConfirmado(true);
        carregarHistorico();
      }
    } finally {
      setAConfirmar(false);
    }
  }

  function novaLeitura() {
    setValidacao(null);
    setConfirmado(false);
    setCodigoManual("");
  }

  return (
    <main className="min-h-screen bg-kipupu-gray100">
      <header className="bg-kipupu-navy text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/brand/logos/logo-mark-light.svg" alt="KIPUPU" width={32} height={30} />
          <div>
            <p className="font-heading font-bold leading-none">Painel da Estação</p>
            <p className="text-xs text-white/70">{session?.user?.estacaoNome ?? "..."}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/estacao/estatisticas" className="text-white/80 hover:text-white">
            Estatísticas
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/estacao/login" })} className="text-white/70 hover:text-white">
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8">
        {!validacao && (
          <section className="bg-white rounded-lg shadow-kipupu p-6">
            <h1 className="font-heading font-bold text-xl text-kipupu-navy">Ler cartão do cliente</h1>
            <p className="text-sm text-kipupu-gray900/60 mt-1">
              Aponta a câmara ao QR code do cartão, ou digita o código manualmente.
            </p>

            <div className="mt-4">
              <LeitorQr onDetectado={(codigo) => validarCodigo(codigo)} />
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Ex.: KIPUPU-A1B2C3-D4E5F6A7"
                className="flex-1 border border-kipupu-gray100 rounded-sm px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-kipupu-cyan"
              />
              <Button onClick={() => validarCodigo(codigoManual)} disabled={aValidar}>
                {aValidar ? "..." : "Validar"}
              </Button>
            </div>
          </section>
        )}

        {validacao && !validacao.valido && (
          <section className="bg-white rounded-lg shadow-kipupu p-6 border-l-4 border-red-500">
            <h2 className="font-heading font-bold text-lg text-red-600">Cartão não validado</h2>
            {validacao.cliente?.nome && (
              <p className="text-sm text-kipupu-gray900/70 mt-1">Cliente: {validacao.cliente.nome}</p>
            )}
            <p className="text-sm text-kipupu-gray900/80 mt-2">{validacao.motivo}</p>
            {validacao.motivo?.includes("sessão de operador") ? (
              <Button
                onClick={() => signOut({ callbackUrl: "/estacao/login" })}
                className="w-full mt-6"
              >
                Sair e voltar a entrar
              </Button>
            ) : (
              <Button onClick={novaLeitura} className="w-full mt-6">
                Nova leitura
              </Button>
            )}
          </section>
        )}

        {validacao && validacao.valido && !confirmado && (
          <section className="bg-white rounded-lg shadow-kipupu p-6 border-l-4 border-kipupu-cyan">
            <h2 className="font-heading font-bold text-lg text-kipupu-navy">Cartão válido</h2>
            <div className="mt-3 space-y-1 text-sm">
              <p><span className="text-kipupu-gray900/60">Cliente:</span> <strong>{validacao.cliente?.nome}</strong></p>
              <p><span className="text-kipupu-gray900/60">Pacote:</span> <strong>{validacao.pacote?.nome}</strong></p>
              <p>
                <span className="text-kipupu-gray900/60">Lavagens este mês:</span>{" "}
                <strong>
                  {validacao.lavagensUsadasMes}
                  {validacao.lavagensRestantes === null ? " (ilimitado)" : ` / ${validacao.pacote?.lavagensMes}`}
                </strong>
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={novaLeitura} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={confirmarLavagem} disabled={aConfirmar} className="flex-1">
                {aConfirmar ? "A confirmar..." : "Confirmar lavagem"}
              </Button>
            </div>
          </section>
        )}

        {confirmado && (
          <section className="bg-white rounded-lg shadow-kipupu p-6 border-l-4 border-green-500 text-center">
            <h2 className="font-heading font-bold text-lg text-green-600">Lavagem registada ✓</h2>
            <p className="text-sm text-kipupu-gray900/70 mt-1">
              {validacao?.cliente?.nome} — {new Date().toLocaleTimeString("pt-PT")}
            </p>
            <Button onClick={novaLeitura} className="w-full mt-6">
              Nova leitura
            </Button>
          </section>
        )}

        <section className="mt-8">
          <h3 className="font-heading font-bold text-sm text-kipupu-navy/70 uppercase tracking-wide mb-3">
            Últimas lavagens nesta estação
          </h3>
          <ul className="space-y-2">
            {historico.map((l) => (
              <li key={l.id} className="bg-white rounded-md p-3 text-sm flex justify-between shadow-sm">
                <span>{l.cliente.nome}</span>
                <span className="text-kipupu-gray900/50">
                  {new Date(l.dataHora).toLocaleString("pt-PT")}
                </span>
              </li>
            ))}
            {historico.length === 0 && (
              <li className="text-sm text-kipupu-gray900/40">Ainda sem lavagens registadas.</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
