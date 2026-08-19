"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";

type Resultado = {
  estacao: { id: string; nome: string };
  operador: { id: string; nome: string; email: string };
  passwordGerada: string;
  whatsappEnviado: boolean;
};

const campoClasse =
  "mt-1 w-full border border-kipupu-gray100 rounded-sm px-3 py-2 outline-none focus:ring-2 focus:ring-kipupu-cyan";
const rotuloClasse = "block mt-4 text-sm font-bold text-kipupu-navy";

export default function NovaEstacaoPage() {
  const [form, setForm] = useState({
    municipio: "",
    distrito: "",
    nome: "",
    morada: "",
    latitude: "",
    longitude: "",
    horario: "Seg–Sáb, 08:00–18:00",
    telefone: "",
    capacidade: "1",
    operadorNome: "",
    operadorEmail: "",
    operadorPassword: "",
    operadorWhatsapp: "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function atualizar(campo: keyof typeof form, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const latitude = Number(form.latitude.replace(",", "."));
    const longitude = Number(form.longitude.replace(",", "."));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setErro("Latitude/longitude têm de ser números (ex.: -8.9712).");
      return;
    }

    setAGuardar(true);
    const resposta = await fetch("/api/admin/estacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        municipio: form.municipio,
        distrito: form.distrito,
        nome: form.nome,
        morada: form.morada,
        latitude,
        longitude,
        horario: form.horario,
        telefone: form.telefone,
        capacidade: Number(form.capacidade) || 1,
        operadorNome: form.operadorNome,
        operadorEmail: form.operadorEmail,
        operadorPassword: form.operadorPassword,
        operadorWhatsapp: form.operadorWhatsapp,
      }),
    });

    setAGuardar(false);

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      setErro(dados.erro ?? "Não foi possível criar a estação.");
      return;
    }

    setResultado(await resposta.json());
  }

  if (resultado) {
    return (
      <main className="min-h-screen bg-kipupu-gray100 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-lg shadow-kipupu p-8 w-full max-w-md">
          <h1 className="font-heading font-bold text-2xl text-kipupu-navy">
            Estação criada ✅
          </h1>
          <p className="text-sm text-kipupu-gray900/70 mt-1">
            &quot;{resultado.estacao.nome}&quot; já aparece no mapa do Processo 1 e na busca por
            proximidade do Processo 2.
          </p>

          {resultado.whatsappEnviado ? (
            <p className="bg-green-50 text-green-700 text-sm rounded-md p-3 mt-6">
              ✓ Credenciais enviadas por WhatsApp ao operador.
            </p>
          ) : (
            <p className="bg-kipupu-gray100 text-kipupu-gray900/70 text-sm rounded-md p-3 mt-6">
              Não foi enviado nenhum WhatsApp automático (número não preenchido, ou a integração
              WhatsApp ainda não está configurada em produção — ver README). Partilha as credenciais
              abaixo manualmente por agora.
            </p>
          )}

          <div className="bg-kipupu-gray100 rounded-md p-4 mt-3">
            <p className="text-sm font-bold text-kipupu-navy mb-2">
              Credenciais do operador — partilha com a estação agora, não voltam a aparecer aqui:
            </p>
            <p className="text-sm">
              <span className="text-kipupu-gray900/60">Login:</span> /estacao/login
            </p>
            <p className="text-sm">
              <span className="text-kipupu-gray900/60">Email:</span> {resultado.operador.email}
            </p>
            <p className="text-sm">
              <span className="text-kipupu-gray900/60">Password:</span>{" "}
              <span className="font-mono font-bold">{resultado.passwordGerada}</span>
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <Link href="/admin/estacoes" className="flex-1">
              <Button variant="secondary" className="w-full">
                Ver todas as estações
              </Button>
            </Link>
            <Button className="flex-1" onClick={() => setResultado(null)}>
              Cadastrar outra
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-kipupu-gray100 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <Link href="/admin/estacoes" className="text-sm text-kipupu-blue font-bold">
          ← Voltar às estações
        </Link>

        <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-kipupu p-8 mt-4">
          <h1 className="font-heading font-bold text-2xl text-kipupu-navy">Nova estação parceira</h1>
          <p className="text-sm text-kipupu-gray900/70 mt-1">
            Dica: para a latitude/longitude, abre o local no Google Maps, clica com o botão direito e
            copia as coordenadas que aparecem no topo do menu.
          </p>

          <h2 className="font-heading font-bold text-sm text-kipupu-navy mt-6 uppercase tracking-wide">
            Localização
          </h2>

          <label className={rotuloClasse}>Município</label>
          <input
            required
            value={form.municipio}
            onChange={(e) => atualizar("municipio", e.target.value)}
            placeholder="Kilamba Kiaxi"
            className={campoClasse}
          />

          <label className={rotuloClasse}>Distrito / bairro</label>
          <input
            required
            value={form.distrito}
            onChange={(e) => atualizar("distrito", e.target.value)}
            placeholder="Nova Vida"
            className={campoClasse}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={rotuloClasse}>Latitude</label>
              <input
                required
                value={form.latitude}
                onChange={(e) => atualizar("latitude", e.target.value)}
                placeholder="-8.9712"
                className={campoClasse}
              />
            </div>
            <div>
              <label className={rotuloClasse}>Longitude</label>
              <input
                required
                value={form.longitude}
                onChange={(e) => atualizar("longitude", e.target.value)}
                placeholder="13.2893"
                className={campoClasse}
              />
            </div>
          </div>

          <h2 className="font-heading font-bold text-sm text-kipupu-navy mt-6 uppercase tracking-wide">
            Dados da estação
          </h2>

          <label className={rotuloClasse}>Nome da estação</label>
          <input
            required
            value={form.nome}
            onChange={(e) => atualizar("nome", e.target.value)}
            placeholder="KIPUPU Ponto Talatona"
            className={campoClasse}
          />

          <label className={rotuloClasse}>Morada / referência</label>
          <input
            required
            value={form.morada}
            onChange={(e) => atualizar("morada", e.target.value)}
            className={campoClasse}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={rotuloClasse}>Horário</label>
              <input
                required
                value={form.horario}
                onChange={(e) => atualizar("horario", e.target.value)}
                className={campoClasse}
              />
            </div>
            <div>
              <label className={rotuloClasse}>Nº de baias</label>
              <input
                type="number"
                min={1}
                required
                value={form.capacidade}
                onChange={(e) => atualizar("capacidade", e.target.value)}
                className={campoClasse}
              />
            </div>
          </div>

          <label className={rotuloClasse}>
            Telefone da estação <span className="font-normal text-kipupu-gray900/50">(opcional)</span>
          </label>
          <input
            value={form.telefone}
            onChange={(e) => atualizar("telefone", e.target.value)}
            placeholder="+244900000000"
            className={campoClasse}
          />

          <h2 className="font-heading font-bold text-sm text-kipupu-navy mt-6 uppercase tracking-wide">
            Conta do operador (login em /estacao/login)
          </h2>

          <label className={rotuloClasse}>Nome do operador</label>
          <input
            required
            value={form.operadorNome}
            onChange={(e) => atualizar("operadorNome", e.target.value)}
            className={campoClasse}
          />

          <label className={rotuloClasse}>Email do operador</label>
          <input
            type="email"
            required
            value={form.operadorEmail}
            onChange={(e) => atualizar("operadorEmail", e.target.value)}
            className={campoClasse}
          />

          <label className={rotuloClasse}>
            Password{" "}
            <span className="font-normal text-kipupu-gray900/50">
              (deixa em branco para gerar automaticamente)
            </span>
          </label>
          <input
            value={form.operadorPassword}
            onChange={(e) => atualizar("operadorPassword", e.target.value)}
            className={campoClasse}
          />

          <label className={rotuloClasse}>
            WhatsApp do operador{" "}
            <span className="font-normal text-kipupu-gray900/50">
              (opcional — se preenchido, tentamos enviar as credenciais automaticamente)
            </span>
          </label>
          <input
            value={form.operadorWhatsapp}
            onChange={(e) => atualizar("operadorWhatsapp", e.target.value)}
            placeholder="+244900000000"
            className={campoClasse}
          />

          {erro && <p className="text-red-600 text-sm mt-4">{erro}</p>}

          <Button type="submit" disabled={aGuardar} className="w-full mt-6">
            {aGuardar ? "A criar..." : "Criar estação"}
          </Button>
        </form>
      </div>
    </main>
  );
}
