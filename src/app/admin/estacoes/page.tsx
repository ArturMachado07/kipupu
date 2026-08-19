"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/Button";

type Estacao = {
  id: string;
  nome: string;
  morada: string;
  latitude: number;
  longitude: number;
  ativa: boolean;
  distrito: { nome: string; municipio: { nome: string } };
  operadores: { id: string; nome: string; email: string; ativo: boolean }[];
  _count: { subscricoes: number; lavagens: number };
};

export default function AdminEstacoesPage() {
  const [estacoes, setEstacoes] = useState<Estacao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aAtualizarId, setAAtualizarId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    const resposta = await fetch("/api/admin/estacoes");
    if (!resposta.ok) {
      setErro("Não foi possível carregar as estações.");
      return;
    }
    setEstacoes(await resposta.json());
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarAtiva(estacao: Estacao) {
    setAAtualizarId(estacao.id);
    const resposta = await fetch(`/api/admin/estacoes/${estacao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativa: !estacao.ativa }),
    });
    setAAtualizarId(null);

    if (resposta.ok) {
      setEstacoes((atual) =>
        atual?.map((e) => (e.id === estacao.id ? { ...e, ativa: !e.ativa } : e)) ?? null
      );
    }
  }

  return (
    <main className="min-h-screen bg-kipupu-gray100 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl text-kipupu-navy">Estações parceiras</h1>
            <p className="text-sm text-kipupu-gray900/70 mt-1">
              Estações reais cadastradas, com as respetivas contas de operador.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/estacoes/nova">
              <Button>+ Nova estação</Button>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-sm text-kipupu-gray900/60 hover:text-kipupu-navy underline"
            >
              Sair
            </button>
          </div>
        </div>

        {erro && (
          <p className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">{erro}</p>
        )}

        {!estacoes && !erro && (
          <p className="text-kipupu-gray900/60">A carregar...</p>
        )}

        {estacoes && estacoes.length === 0 && (
          <div className="bg-white rounded-lg shadow-kipupu p-8 text-center text-kipupu-gray900/70">
            Ainda não há nenhuma estação cadastrada.{" "}
            <Link href="/admin/estacoes/nova" className="text-kipupu-blue font-bold">
              Cadastrar a primeira
            </Link>
            .
          </div>
        )}

        {estacoes && estacoes.length > 0 && (
          <div className="bg-white rounded-lg shadow-kipupu overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-kipupu-gray100 text-kipupu-navy text-left">
                <tr>
                  <th className="px-4 py-3 font-bold">Estação</th>
                  <th className="px-4 py-3 font-bold">Localização</th>
                  <th className="px-4 py-3 font-bold">Operador(es)</th>
                  <th className="px-4 py-3 font-bold">Lavagens</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {estacoes.map((estacao) => (
                  <tr key={estacao.id} className="border-t border-kipupu-gray100">
                    <td className="px-4 py-3">
                      <div className="font-bold text-kipupu-navy">{estacao.nome}</div>
                      <div className="text-kipupu-gray900/60 text-xs">{estacao.morada}</div>
                    </td>
                    <td className="px-4 py-3">
                      {estacao.distrito.nome}, {estacao.distrito.municipio.nome}
                      <div className="text-kipupu-gray900/60 text-xs">
                        {estacao.latitude.toFixed(4)}, {estacao.longitude.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {estacao.operadores.length === 0 && (
                        <span className="text-kipupu-gray900/50">Sem operador</span>
                      )}
                      {estacao.operadores.map((op) => (
                        <div key={op.id}>
                          {op.nome} <span className="text-kipupu-gray900/50">({op.email})</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3">{estacao._count.lavagens}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          estacao.ativa
                            ? "text-green-700 bg-green-50 rounded-full px-2 py-0.5 text-xs font-bold"
                            : "text-kipupu-gray900/60 bg-kipupu-gray100 rounded-full px-2 py-0.5 text-xs font-bold"
                        }
                      >
                        {estacao.ativa ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => alternarAtiva(estacao)}
                        disabled={aAtualizarId === estacao.id}
                        className="text-xs font-bold text-kipupu-blue hover:underline disabled:opacity-50"
                      >
                        {estacao.ativa ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
