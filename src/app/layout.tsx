import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "KIPUPU — A plataforma que lava o seu carro",
  description:
    "Plataforma on-demand de lavagem de viaturas em Angola. Escolhe a estação mais próxima no mapa, gera o teu cartão digital e lava o teu carro com qualidade premium a um preço que cabe no bolso.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <body className="font-body min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
