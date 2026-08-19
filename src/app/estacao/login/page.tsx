"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/Button";

/** Login separado do painel da estação — não usa a mesma sessão dos clientes. */
export default function EstacaoLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setACarregar(true);

    const resultado = await signIn("operador", { email, password, redirect: false });

    setACarregar(false);

    if (resultado?.error) {
      setErro("Email ou password incorretos.");
      return;
    }

    router.push("/estacao/painel");
  }

  return (
    <main className="min-h-screen bg-kipupu-gradient flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-kipupu p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <Image src="/brand/logos/logo-mark-dark.svg" alt="KIPUPU" width={56} height={52} />
        </div>
        <h1 className="font-heading font-bold text-2xl text-kipupu-navy text-center">
          Painel da Estação
        </h1>
        <p className="text-sm text-kipupu-gray900/70 mt-1 text-center">
          Acesso reservado a operadores das estações parceiras.
        </p>

        <label className="block mt-6 text-sm font-bold text-kipupu-navy">Email do operador</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-kipupu-gray100 rounded-sm px-3 py-2 outline-none focus:ring-2 focus:ring-kipupu-cyan"
          placeholder="operador@kipupu.ao"
        />

        <label className="block mt-4 text-sm font-bold text-kipupu-navy">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-kipupu-gray100 rounded-sm px-3 py-2 outline-none focus:ring-2 focus:ring-kipupu-cyan"
          placeholder="••••••••"
        />

        {erro && <p className="text-red-600 text-sm mt-3">{erro}</p>}

        <Button type="submit" disabled={aCarregar} className="w-full mt-6">
          {aCarregar ? "A entrar..." : "Entrar"}
        </Button>

        <p className="text-xs text-center mt-4 text-kipupu-gray900/40">
          Conta de demonstração: operador@kipupu.ao / estacao123
        </p>
      </form>
    </main>
  );
}
