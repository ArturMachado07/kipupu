"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";

export default function RegistoPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setACarregar(true);

    const resposta = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, whatsapp, password }),
    });

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      setErro(dados.erro ?? "Não foi possível criar a conta.");
      setACarregar(false);
      return;
    }

    // Após registo, autentica automaticamente e segue para o pop-up de pacotes (Processo 2).
    await signIn("credentials", { email, password, redirect: false });
    setACarregar(false);
    router.push("/dashboard");
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center bg-kipupu-gray100 px-4 py-16">
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-lg shadow-kipupu p-8 w-full max-w-sm"
        >
          <h1 className="font-heading font-bold text-2xl text-kipupu-navy">Criar conta</h1>
          <p className="text-sm text-kipupu-gray900/70 mt-1">
            Regista-te para aderires ao cartão KIPUPU.
          </p>

          <label className="block mt-6 text-sm font-bold text-kipupu-navy">Nome completo</label>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 w-full border border-kipupu-gray100 rounded-sm px-3 py-2 outline-none focus:ring-2 focus:ring-kipupu-cyan"
          />

          <label className="block mt-4 text-sm font-bold text-kipupu-navy">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-kipupu-gray100 rounded-sm px-3 py-2 outline-none focus:ring-2 focus:ring-kipupu-cyan"
          />

          <label className="block mt-4 text-sm font-bold text-kipupu-navy">
            WhatsApp <span className="font-normal text-kipupu-gray900/50">(formato +244...)</span>
          </label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+244900000000"
            className="mt-1 w-full border border-kipupu-gray100 rounded-sm px-3 py-2 outline-none focus:ring-2 focus:ring-kipupu-cyan"
          />

          <label className="block mt-4 text-sm font-bold text-kipupu-navy">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-kipupu-gray100 rounded-sm px-3 py-2 outline-none focus:ring-2 focus:ring-kipupu-cyan"
          />

          {erro && <p className="text-red-600 text-sm mt-3">{erro}</p>}

          <Button type="submit" disabled={aCarregar} className="w-full mt-6">
            {aCarregar ? "A criar conta..." : "Criar conta"}
          </Button>

          <p className="text-sm text-center mt-4 text-kipupu-gray900/70">
            Já tens conta?{" "}
            <Link href="/login" className="text-kipupu-blue font-bold">
              Entrar
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </>
  );
}
