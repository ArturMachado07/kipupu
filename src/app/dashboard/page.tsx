"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { PopupPacotes, type Pacote } from "@/components/PopupPacotes";
import { PopupPagamento } from "@/components/PopupPagamento";
import { CartaoDigitalPreview, type CartaoDados } from "@/components/CartaoDigitalPreview";
import type { MarcadorMapa } from "@/components/MapaLuanda";

const MapaLuanda = dynamic(() => import("@/components/MapaLuanda").then((m) => m.MapaLuanda), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-kipupu-gray900/40 text-sm">
      A carregar mapa...
    </div>
  ),
});

const CENTRO_LUANDA: [number, number] = [-8.839, 13.289];

type Subscricao = {
  id: string;
  estado: string;
  pacote: { id: string; nome: string; precoMensal: number };
  estacao: { id: string; nome: string } | null;
  cartao: { codigo: string; qrDataUrl: string; validade: string } | null;
};

type EstacaoProxima = MarcadorMapa & {
  morada: string;
  distanciaKm: number;
};

type Etapa = "a-carregar" | "pacotes" | "pagamento" | "localizar" | "conta";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [etapa, setEtapa] = useState<Etapa>("a-carregar");
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [subscricaoAtiva, setSubscricaoAtiva] = useState<Subscricao | null>(null);
  const [subscricaoPendenteId, setSubscricaoPendenteId] = useState<string | null>(null);
  const [pacoteEscolhido, setPacoteEscolhido] = useState<Pacote | null>(null);
  const [cartao, setCartao] = useState<CartaoDados | null>(null);

  const [posicao, setPosicao] = useState<{ latitude: number; longitude: number } | null>(null);
  const [estacoesProximas, setEstacoesProximas] = useState<EstacaoProxima[]>([]);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Processo 2, Passo 1: mal o cliente entra, verificamos se já tem subscrição ativa;
  // caso contrário abrimos automaticamente o pop-up de pacotes.
  const carregarSubscricoes = useCallback(async () => {
    const resp = await fetch("/api/subscricoes");
    if (!resp.ok) return;
    const subscricoes: Subscricao[] = await resp.json();
    const ativa = subscricoes.find((s) => s.estado === "ativa" && s.cartao);

    if (ativa && ativa.cartao) {
      setSubscricaoAtiva(ativa);
      setCartao({
        subscricaoId: ativa.id,
        codigo: ativa.cartao.codigo,
        qrDataUrl: ativa.cartao.qrDataUrl,
        nomeCliente: session?.user?.name ?? "",
        pacoteNome: ativa.pacote.nome,
        estacaoNome: ativa.estacao?.nome,
        ambitoUso: ativa.estacao ? "estacao_unica" : "rede_aberta",
        validade: ativa.cartao.validade,
      });
      setEtapa("conta");
      return;
    }

    const resp2 = await fetch("/api/pacotes");
    setPacotes(await resp2.json());
    setEtapa("pacotes");
  }, [session]);

  useEffect(() => {
    if (status === "authenticated") {
      carregarSubscricoes();
    }
  }, [status, carregarSubscricoes]);

  // Passo 1 (continuação): escolher pacote cria a subscrição pendente e avança para pagamento.
  async function escolherPacote(p: Pacote) {
    setErro(null);
    setPacoteEscolhido(p);
    try {
      const resp = await fetch("/api/subscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacoteId: p.id, ambitoUso: "rede_aberta" }),
      });
      if (!resp.ok) throw new Error();
      const subscricao = await resp.json();
      setSubscricaoPendenteId(subscricao.id);
      setEtapa("pagamento");
    } catch {
      setErro("Não foi possível iniciar a subscrição.");
    }
  }

  // Passo 2: pagamento confirmado -> gera cartão e avança para localizar estação.
  async function onPagamentoConcluido() {
    if (!subscricaoPendenteId) return;
    const resp = await fetch(`/api/cartao/${subscricaoPendenteId}`);
    const dados = await resp.json();
    setCartao({
      subscricaoId: subscricaoPendenteId,
      codigo: dados.cartao.codigo,
      qrDataUrl: dados.cartao.qrDataUrl,
      nomeCliente: session?.user?.name ?? "",
      pacoteNome: dados.pacote.nome,
      estacaoNome: dados.estacao?.nome,
      ambitoUso: dados.ambitoUso,
      validade: dados.cartao.validade,
    });
    setEtapa("localizar");
  }

  // Passo 3: geolocalização do browser -> estação mais próxima.
  function localizarEstacaoMaisProxima() {
    setErroLocalizacao(null);
    if (!("geolocation" in navigator)) {
      setErroLocalizacao("O teu navegador não suporta geolocalização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosicao({ latitude, longitude });
        const resp = await fetch(`/api/estacoes?lat=${latitude}&lng=${longitude}`);
        const dados = await resp.json();
        setEstacoesProximas(
          dados.map((e: any) => ({
            id: e.id,
            nome: e.nome,
            latitude: e.latitude,
            longitude: e.longitude,
            morada: e.morada,
            distanciaKm: e.distanciaKm,
          }))
        );
      },
      () => setErroLocalizacao("Não foi possível obter a tua localização. Ativa o GPS/permissão de localização.")
    );
  }

  async function guardarEstacaoPreferida(estacaoId: string) {
    if (!cartao) return;
    await fetch(`/api/subscricoes/${cartao.subscricaoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estacaoId }),
    });
    setEtapa("conta");
    carregarSubscricoes();
  }

  if (status !== "authenticated" || etapa === "a-carregar") {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center py-24 text-kipupu-gray900/50">
          A carregar...
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}

        {etapa === "pacotes" && (
          <PopupPacotes pacotes={pacotes} onEscolher={escolherPacote} onFechar={() => router.push("/")} />
        )}

        {etapa === "pagamento" && subscricaoPendenteId && pacoteEscolhido && (
          <PopupPagamento
            subscricaoId={subscricaoPendenteId}
            valor={pacoteEscolhido.precoMensal}
            onConcluido={onPagamentoConcluido}
            onFechar={() => setEtapa("pacotes")}
          />
        )}

        {etapa === "localizar" && cartao && (
          <section>
            <h1 className="font-heading font-bold text-2xl text-kipupu-navy">
              Passo 3 — Localizar a estação mais próxima
            </h1>
            <p className="text-sm text-kipupu-gray900/60 mt-1">
              O teu cartão já está ativo e vale em qualquer estação parceira. Podes ainda assim
              marcar a mais próxima de ti como preferida.
            </p>

            <div className="mt-6">
              <Button onClick={localizarEstacaoMaisProxima}>Usar a minha localização</Button>
              {erroLocalizacao && <p className="text-red-600 text-sm mt-2">{erroLocalizacao}</p>}
            </div>

            {estacoesProximas.length > 0 && (
              <>
                <div className="h-[360px] rounded-lg overflow-hidden border border-kipupu-gray100 mt-6">
                  <MapaLuanda
                    centro={[estacoesProximas[0].latitude, estacoesProximas[0].longitude]}
                    zoom={14}
                    marcadores={estacoesProximas}
                  />
                </div>
                <ul className="mt-4 space-y-2">
                  {estacoesProximas.slice(0, 5).map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between bg-white border border-kipupu-gray100 rounded-md p-3"
                    >
                      <div>
                        <p className="font-bold text-kipupu-navy text-sm">{e.nome}</p>
                        <p className="text-xs text-kipupu-gray900/60">
                          {e.morada} — {e.distanciaKm.toFixed(1)} km
                        </p>
                      </div>
                      <Button variant="ghost" onClick={() => guardarEstacaoPreferida(e.id)}>
                        Marcar como preferida
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Button variant="ghost" onClick={() => setEtapa("conta")} className="mt-8">
              Saltar — ver o meu cartão
            </Button>
          </section>
        )}

        {etapa === "conta" && cartao && (
          <section>
            <h1 className="font-heading font-bold text-2xl text-kipupu-navy mb-6">A minha conta</h1>
            <CartaoDigitalPreview cartao={cartao} />
            {subscricaoAtiva?.estacao && (
              <p className="text-center text-sm text-kipupu-gray900/60 mt-4">
                Estação preferida: <strong>{subscricaoAtiva.estacao.nome}</strong>
              </p>
            )}
            <div className="text-center mt-6">
              <Button variant="ghost" onClick={() => setEtapa("localizar")}>
                Localizar / alterar estação preferida
              </Button>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
