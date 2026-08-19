import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Login de clientes (Processo 1 e 2).
    CredentialsProvider({
      id: "credentials",
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const cliente = await prisma.cliente.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!cliente) return null;

        const senhaValida = await bcrypt.compare(credentials.password, cliente.passwordHash);
        if (!senhaValida) return null;

        return {
          id: cliente.id,
          name: cliente.nome,
          email: cliente.email,
          role: "cliente" as const,
        };
      },
    }),

    // Login de operadores de estação (painel de leitura do QR code).
    CredentialsProvider({
      id: "operador",
      name: "Operador de Estação",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const operador = await prisma.operadorEstacao.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { estacao: true },
        });
        if (!operador || !operador.ativo) return null;

        const senhaValida = await bcrypt.compare(credentials.password, operador.passwordHash);
        if (!senhaValida) return null;

        return {
          id: operador.id,
          name: operador.nome,
          email: operador.email,
          role: "operador" as const,
          estacaoId: operador.estacaoId,
          estacaoNome: operador.estacao.nome,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.clienteId = user.id;
        token.role = (user as { role?: "cliente" | "operador" }).role ?? "cliente";
        token.estacaoId = (user as { estacaoId?: string }).estacaoId;
        token.estacaoNome = (user as { estacaoNome?: string }).estacaoNome;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.clienteId as string;
        session.user.role = token.role ?? "cliente";
        session.user.estacaoId = token.estacaoId;
        session.user.estacaoNome = token.estacaoNome;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
