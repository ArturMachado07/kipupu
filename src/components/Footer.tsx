import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-kipupu-navy text-white/70 text-xs py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} KIPUPU — Húmuos Grupo. Todos os direitos reservados.</span>
        <div className="flex items-center gap-4">
          <Link href="/estacao/login" className="hover:text-white">
            Sou uma estação parceira
          </Link>
          <span>Luanda, Angola</span>
        </div>
      </div>
    </footer>
  );
}
