"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setACarregar(true);

    const resultado = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setACarregar(false);

    if (resultado?.error) {
      setErro("Email ou password incorretos.");
      return;
    }

    // Processo 2, Passo 1: após login, segue para o pop-up de pacotes/pagamento.
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
          <h1 className="font-heading font-bold text-2xl text-kipupu-navy">Entrar</h1>
          <p className="text-sm text-kipupu-gray900/70 mt-1">
            Acede à tua conta KIPUPU.
          </p>

          <label className="block mt-6 text-sm font-bold text-kipupu-navy">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-kipupu-gray100 rounded-sm px-3 py-2 outline-none focus:ring-2 focus:ring-kipupu-cyan"
            placeholder="demo@kipupu.ao"
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

          <p className="text-sm text-center mt-4 text-kipupu-gray900/70">
            Ainda não tens conta?{" "}
            <Link href="/registo" className="text-kipupu-blue font-bold">
              Regista-te
            </Link>
          </p>

          <p className="text-xs text-center mt-4 text-kipupu-gray900/40">
            Conta de demonstração: demo@kipupu.ao / kipupu123
          </p>
        </form>
      </main>
      <Footer />
    </>
  );
}
