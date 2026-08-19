"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartaoDigitalPreview, type CartaoDados } from "@/components/CartaoDigitalPreview";

/** Vista direta e partilhável do cartão digital de uma subscrição. */
export default function CartaoPage({ params }: { params: { id: string } }) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [cartao, setCartao] = useState<CartaoDados | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/cartao/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).erro ?? "Erro");
        return r.json();
      })
      .then((dados) =>
        setCartao({
          subscricaoId: params.id,
          codigo: dados.cartao.codigo,
          qrDataUrl: dados.cartao.qrDataUrl,
          nomeCliente: session?.user?.name ?? dados.cliente?.nome ?? "",
          pacoteNome: dados.pacote.nome,
          estacaoNome: dados.estacao?.nome,
          ambitoUso: dados.ambitoUso,
          validade: dados.cartao.validade,
        })
      )
      .catch((e) => setErro(String(e.message ?? e)));
  }, [status, params.id, session]);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-10">
        {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}
        {cartao ? (
          <CartaoDigitalPreview cartao={cartao} />
        ) : (
          !erro && <p className="text-center text-kipupu-gray900/50">A carregar cartão...</p>
        )}
      </main>
      <Footer />
    </>
  );
}
