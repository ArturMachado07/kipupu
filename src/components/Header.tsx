import Link from "next/link";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="w-full bg-white/90 backdrop-blur border-b border-kipupu-gray100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Logo variant="dark" />
        <nav className="flex items-center gap-4 text-sm font-body">
          <Link href="/processo-1" className="text-kipupu-navy hover:text-kipupu-blue">
            Escolher estação
          </Link>
          <Link href="/dashboard" className="text-kipupu-navy hover:text-kipupu-blue">
            A minha conta
          </Link>
          <Link
            href="/login"
            className="bg-kipupu-navy text-white px-4 py-2 rounded-md hover:bg-kipupu-navy/90"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
