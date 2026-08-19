"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { PopupDetalhesEstacao, type EstacaoDetalhe } from "@/components/PopupDetalhesEstacao";
import { PopupPacotes, type Pacote } from "@/components/PopupPacotes";
import { PopupPagamento } from "@/components/PopupPagamento";
import { CartaoDigitalPreview, type CartaoDados } from "@/components/CartaoDigitalPreview";
import type { MarcadorMapa } from "@/components/MapaLuanda";

// Leaflet usa `window`, por isso o mapa só pode ser carregado no cliente.
const MapaLuanda = dynamic(() => import("@/components/MapaLuanda").then((m) => m.MapaLuanda), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-kipupu-gray900/40 text-sm">
      A carregar mapa...
    </div>
  ),
});

// Centro aproximado da Província de Luanda / Kilamba Kiaxi / Nova Vida.
const CENTRO_LUANDA: [number, number] = [-8.839, 13.289];
const CENTRO_NOVA_VIDA: [number, number] = [-8.973, 13.287];

type Municipio = { id: string; nome: string };
type Distrito = { id: string; nome: string };
type Estacao = {
  id: string;
  nome: string;
  morada: string;
  horario: string;
  telefone?: string | null;
  capacidade: number;
  latitude: number;
  longitude: number;
};

type Passo =
  | "municipio"
  | "distrito"
  | "estacao"
  | "detalhes"
  | "pacote"
  | "pagamento"
  | "cartao";

export default function Processo1Page() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [passo, setPasso] = useState<Passo>("municipio");

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipio, setMunicipio] = useState<Municipio | null>(null);

  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [distrito, setDistrito] = useState<Distrito | null>(null);

  const [estacoes, setEstacoes] = useState<Estacao[]>([]);
  const [estacaoSelecionada, setEstacaoSelecionada] = useState<Estacao | null>(null);

  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [pacoteEscolhido, setPacoteEscolhido] = useState<Pacote | null>(null);

  const [subscricaoId, setSubscricaoId] = useState<string | null>(null);
  const [cartao, setCartao] = useState<CartaoDados | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Passo 1: Município (mapa da Província de Luanda)
  useEffect(() => {
    fetch("/api/municipios").then((r) => r.json()).then(setMunicipios);
  }, []);

  async function selecionarMunicipio(m: Municipio) {
    setMunicipio(m);
    const resp = await fetch(`/api/municipios/${m.id}/distritos`);
    setDistritos(await resp.json());
    setPasso("distrito");
  }

  // Passo 2: Distrito (mapa do Município)
  async function selecionarDistrito(d: Distrito) {
    setDistrito(d);
    const resp = await fetch(`/api/distritos/${d.id}/estacoes`);
    setEstacoes(await resp.json());
    setPasso("estacao");
  }

  // Passo 3: Estação (mapa do Distrito Urbano)
  function selecionarEstacaoNoMapa(marcador: MarcadorMapa) {
    const est = estacoes.find((e) => e.id === marcador.id) ?? null;
    setEstacaoSelecionada(est);
    if (est) setPasso("detalhes");
  }

  // Passo 4 -> 5: confirma estação, abre pacotes
  async function confirmarEstacao() {
    if (pacotes.length === 0) {
      const resp = await fetch("/api/pacotes");
      setPacotes(await resp.json());
    }
    setPasso("pacote");
  }

  // Passo 5 -> 6: escolhe pacote, cria subscrição e abre pagamento
  async function escolherPacote(p: Pacote) {
    setErro(null);

    if (status !== "authenticated") {
      // Guarda a intenção e manda para login/registo antes de criar a subscrição.
      router.push(`/login?depois=processo-1`);
      return;
    }

    setPacoteEscolhido(p);
    try {
      const resp = await fetch("/api/subscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacoteId: p.id,
          estacaoId: estacaoSelecionada?.id,
          ambitoUso: "rede_aberta",
        }),
      });
      if (!resp.ok) throw new Error();
      const subscricao = await resp.json();
      setSubscricaoId(subscricao.id);
      setPasso("pagamento");
    } catch {
      setErro("Não foi possível criar a subscrição. Tenta novamente.");
    }
  }

  // Passo 6 -> 7: pagamento confirmado, busca o cartão digital gerado
  async function onPagamentoConcluido() {
    if (!subscricaoId) return;
    const resp = await fetch(`/api/cartao/${subscricaoId}`);
    const dados = await resp.json();
    setCartao({
      subscricaoId,
      codigo: dados.cartao.codigo,
      qrDataUrl: dados.cartao.qrDataUrl,
      nomeCliente: session?.user?.name ?? "",
      pacoteNome: dados.pacote.nome,
      estacaoNome: dados.estacao?.nome,
      ambitoUso: dados.ambitoUso,
      validade: dados.cartao.validade,
    });
    setPasso("cartao");
  }

  const marcadoresEstacoes: MarcadorMapa[] = estacoes.map((e) => ({
    id: e.id,
    nome: e.nome,
    latitude: e.latitude,
    longitude: e.longitude,
  }));

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <ProgressoPassos passoAtual={passo} />

        {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}

        {passo === "municipio" && (
          <Secao titulo="Passo 1 — Seleciona o teu Município" subtitulo="Mapa da Província de Luanda">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {municipios.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selecionarMunicipio(m)}
                  className="bg-white border border-kipupu-gray100 rounded-md p-4 text-left hover:border-kipupu-cyan hover:shadow-kipupu transition"
                >
                  <span className="font-heading font-bold text-kipupu-navy">{m.nome}</span>
                </button>
              ))}
              {municipios.length === 0 && (
                <p className="text-sm text-kipupu-gray900/50">
                  Ainda sem municípios com estações — corre o seed (ver README).
                </p>
              )}
            </div>
          </Secao>
        )}

        {passo === "distrito" && municipio && (
          <Secao
            titulo={`Passo 2 — Seleciona o Distrito em ${municipio.nome}`}
            subtitulo={`Mapa do Município ${municipio.nome}`}
          >
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {distritos.map((d) => (
                <button
                  key={d.id}
                  onClick={() => selecionarDistrito(d)}
                  className="bg-white border border-kipupu-gray100 rounded-md p-4 text-left hover:border-kipupu-cyan hover:shadow-kipupu transition"
                >
                  <span className="font-heading font-bold text-kipupu-navy">{d.nome}</span>
                </button>
              ))}
            </div>
            <VoltarBotao onClick={() => setPasso("municipio")} />
          </Secao>
        )}

        {passo === "estacao" && distrito && (
          <Secao
            titulo={`Passo 3 — Escolhe a Estação em ${distrito.nome}`}
            subtitulo="Toca num ponto do mapa para ver os detalhes"
          >
            {estacoes.length === 0 ? (
              <p className="text-sm text-kipupu-gray900/50 bg-kipupu-gray100 rounded-md p-4">
                Nenhuma estação encontrada para este distrito — confirma que correste{" "}
                <code>npm run prisma:seed</code>.
              </p>
            ) : (
              <div className="h-[420px] rounded-lg overflow-hidden border border-kipupu-gray100">
                <MapaLuanda
                  centro={CENTRO_NOVA_VIDA}
                  zoom={14}
                  marcadores={marcadoresEstacoes}
                  marcadorSelecionadoId={estacaoSelecionada?.id}
                  onSelecionar={selecionarEstacaoNoMapa}
                />
              </div>
            )}
            <VoltarBotao onClick={() => setPasso("distrito")} />
          </Secao>
        )}

        {passo === "detalhes" && estacaoSelecionada && (
          <PopupDetalhesEstacao
            estacao={estacaoSelecionada}
            onConfirmar={confirmarEstacao}
            onVoltar={() => setPasso("estacao")}
          />
        )}

        {passo === "pacote" && (
          <PopupPacotes
            pacotes={pacotes}
            onEscolher={escolherPacote}
            onFechar={() => setPasso("detalhes")}
          />
        )}

        {passo === "pagamento" && subscricaoId && pacoteEscolhido && (
          <PopupPagamento
            subscricaoId={subscricaoId}
            valor={pacoteEscolhido.precoMensal}
            onConcluido={onPagamentoConcluido}
            onFechar={() => setPasso("pacote")}
          />
        )}

        {passo === "cartao" && cartao && (
          <Secao titulo="Passo 7 — O teu cartão digital KIPUPU" subtitulo="Mostra-o em qualquer estação">
            <CartaoDigitalPreview cartao={cartao} />
          </Secao>
        )}
      </main>
      <Footer />
    </>
  );
}

function Secao({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h1 className="font-heading font-bold text-2xl text-kipupu-navy">{titulo}</h1>
      {subtitulo && <p className="text-sm text-kipupu-gray900/60 mt-1">{subtitulo}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function VoltarBotao({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className="mt-6">
      ← Voltar
    </Button>
  );
}

const PASSOS_ORDEM: { chave: Passo; label: string }[] = [
  { chave: "municipio", label: "Município" },
  { chave: "distrito", label: "Distrito" },
  { chave: "estacao", label: "Estação" },
  { chave: "pacote", label: "Pacote" },
  { chave: "pagamento", label: "Pagamento" },
  { chave: "cartao", label: "Cartão" },
];

function ProgressoPassos({ passoAtual }: { passoAtual: Passo }) {
  const indiceAtual = PASSOS_ORDEM.findIndex((p) =>
    p.chave === passoAtual || (passoAtual === "detalhes" && p.chave === "estacao")
  );

  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto">
      {PASSOS_ORDEM.map((p, i) => (
        <div key={p.chave} className="flex items-center gap-2 shrink-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              i <= indiceAtual ? "bg-kipupu-navy text-white" : "bg-kipupu-gray100 text-kipupu-gray900/40"
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-xs ${i <= indiceAtual ? "text-kipupu-navy font-bold" : "text-kipupu-gray900/40"}`}>
            {p.label}
          </span>
          {i < PASSOS_ORDEM.length - 1 && <div className="w-6 h-px bg-kipupu-gray100" />}
        </div>
      ))}
    </div>
  );
}
