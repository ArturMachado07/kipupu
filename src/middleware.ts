import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Protege duas áreas distintas com sessões separadas:
 *  - /dashboard, /cartao       -> conta de cliente
 *  - /estacao/painel           -> conta de operador de estação
 *
 * Não se usa o wrapper `withAuth` por omissão porque este só suporta uma
 * página de login global — aqui precisamos de redirecionar cada área para o
 * seu próprio login (/login vs /estacao/login).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith("/estacao/painel")) {
    if (!token || token.role !== "operador") {
      const url = req.nextUrl.clone();
      url.pathname = "/estacao/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!token || token.role === "operador") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/cartao/:path*", "/estacao/painel/:path*"],
};
