import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { prisma } from "@/lib/prisma";

async function getPacotes() {
  return prisma.pacote.findMany({ orderBy: { ordem: "asc" } });
}

export default async function HomePage() {
  const pacotes = await getPacotes();

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-kipupu-gradient text-white">
          <div className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="font-heading font-bold text-4xl md:text-5xl leading-tight">
                A tua lavagem, mais perto de ti
              </h1>
              <p className="mt-4 text-white/85 text-lg max-w-md">
                Plataforma on-demand de lavagem de viaturas em Angola. Encontra a estação
                parceira mais próxima, adquire o teu cartão digital e lava o teu carro com
                qualidade premium a um preço que cabe no bolso.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/processo-1">
                  <Button variant="secondary">Escolher a minha estação</Button>
                </Link>
                <Link href="/registo">
                  <Button variant="ghost" className="border-white text-white hover:bg-white/10">
                    Criar conta
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <Image
                src="/brand/logos/logo-mark-light.svg"
                alt="Símbolo KIPUPU"
                width={260}
                height={240}
                priority
              />
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-heading font-bold text-2xl text-kipupu-navy text-center">
            Como funciona
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "icon-estacao", titulo: "1. Localiza", texto: "Vê no mapa a estação parceira mais próxima de ti." },
              { icon: "icon-perfil", titulo: "2. Regista-te", texto: "Escolhe o pacote e paga por referência ou transferência." },
              { icon: "icon-lavagem", titulo: "3. Gera o cartão", texto: "Recebe o teu cartão digital com QR code, pronto a usar." },
              { icon: "icon-suporte", titulo: "4. Lava o carro", texto: "Mostra o cartão na estação e usufrui do serviço." },
            ].map((item) => (
              <div key={item.titulo} className="bg-white rounded-lg shadow-kipupu p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-kipupu-navy flex items-center justify-center mb-4">
                  <Image src={`/brand/icons/${item.icon}.svg`} alt="" width={32} height={32} />
                </div>
                <h3 className="font-heading font-bold text-kipupu-navy">{item.titulo}</h3>
                <p className="text-sm text-kipupu-gray900/80 mt-2">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pacotes */}
        <section className="bg-kipupu-gray100 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-heading font-bold text-2xl text-kipupu-navy text-center">
              Escolhe o teu pacote
            </h2>
            <div className="mt-10 grid md:grid-cols-3 gap-6">
              {pacotes.map((pacote) => (
                <div
                  key={pacote.id}
                  className={`bg-white rounded-lg p-6 shadow-kipupu flex flex-col ${
                    pacote.slug === "intermedio" ? "ring-2 ring-kipupu-cyan" : ""
                  }`}
                >
                  {pacote.slug === "intermedio" && (
                    <span className="self-start bg-kipupu-cyan text-kipupu-navy text-xs font-bold px-2 py-1 rounded-full mb-2">
                      Mais escolhido
                    </span>
                  )}
                  <h3 className="font-heading font-bold text-xl text-kipupu-navy">{pacote.nome}</h3>
                  <p className="text-sm text-kipupu-gray900/70 mt-1">{pacote.descricao}</p>
                  <div className="mt-4 text-3xl font-heading font-bold text-kipupu-navy">
                    {pacote.precoMensal.toLocaleString("pt-PT")} Kz
                    <span className="text-sm font-body font-normal text-kipupu-gray900/60">/mês</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm flex-1">
                    {pacote.beneficios.split("|").map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="text-kipupu-blue mt-0.5">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/processo-1" className="mt-6">
                    <Button className="w-full">Escolher {pacote.nome}</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
