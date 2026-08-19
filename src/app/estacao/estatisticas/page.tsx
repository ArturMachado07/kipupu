"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

type Estatisticas = {
  hoje: number;
  semana: number;
  mes: number;
  total: number;
  clientesUnicos: number;
  porDia: { data: string; quantidade: number }[];
};

type LavagemHistorico = {
  id: string;
  dataHora: string;
  cliente: { nome: string };
};

function formatarDiaCurto(data: string): string {
  // "2026-08-19" -> "19/08"
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

export default function EstatisticasEstacaoPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [historico, setHistorico] = useState<LavagemHistorico[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const [respStats, respHistorico] = await Promise.all([
        fetch("/api/estacao/estatisticas"),
        fetch("/api/estacao/historico"),
      ]);

      if (!respStats.ok) {
        setErro("Não foi possível carregar as estatísticas.");
        return;
      }

      setStats(await respStats.json());
      if (respHistorico.ok) setHistorico(await respHistorico.json());
    }
    carregar();
  }, []);

  const maximoPorDia = stats ? Math.max(1, ...stats.porDia.map((d) => d.quantidade)) : 1;

  return (
    <main className="min-h-screen bg-kipupu-gray100">
      <header className="bg-kipupu-navy text-white px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/logos/logo-mark-light.svg" alt="KIPUPU" width={32} height={30} />
            <div>
              <p className="font-heading font-bold leading-none">Estatísticas</p>
              <p className="text-xs text-white/70">{session?.user?.estacaoNome ?? "..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/estacao/painel" className="text-white/80 hover:text-white">
              Ler cartão
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/estacao/login" })} className="text-white/70 hover:text-white">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {erro && <p className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">{erro}</p>}

        {!stats && !erro && <p className="text-kipupu-gray900/60">A carregar...</p>}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { rotulo: "Hoje", valor: stats.hoje },
                { rotulo: "Esta semana", valor: stats.semana },
                { rotulo: "Este mês", valor: stats.mes },
                { rotulo: "Total (sempre)", valor: stats.total },
              ].map((item) => (
                <div key={item.rotulo} className="bg-white rounded-lg shadow-kipupu p-4 text-center">
                  <p className="text-3xl font-heading font-bold text-kipupu-navy">{item.valor}</p>
                  <p className="text-xs text-kipupu-gray900/60 mt-1">{item.rotulo}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-kipupu p-4 mt-3 text-center">
              <p className="text-lg font-heading font-bold text-kipupu-navy">{stats.clientesUnicos}</p>
              <p className="text-xs text-kipupu-gray900/60 mt-1">Clientes diferentes já atendidos nesta estação</p>
            </div>

            <section className="bg-white rounded-lg shadow-kipupu p-6 mt-6">
              <h2 className="font-heading font-bold text-sm text-kipupu-navy uppercase tracking-wide mb-4">
                Lavagens por dia (últimos 14 dias)
              </h2>
              <div className="flex items-end gap-1.5 h-32">
                {stats.porDia.map((dia) => (
                  <div key={dia.data} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <span className="text-[10px] text-kipupu-gray900/50 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {dia.quantidade}
                    </span>
                    <div
                      title={`${dia.quantidade} lavagem(ns) em ${formatarDiaCurto(dia.data)}`}
                      className="w-full bg-kipupu-cyan rounded-t-sm min-h-[2px]"
                      style={{ height: `${(dia.quantidade / maximoPorDia) * 100}%` }}
                    />
                    <span className="text-[10px] text-kipupu-gray900/40 mt-1">{formatarDiaCurto(dia.data)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h3 className="font-heading font-bold text-sm text-kipupu-navy/70 uppercase tracking-wide mb-3">
                Últimas lavagens
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
          </>
        )}
      </div>
    </main>
  );
}
