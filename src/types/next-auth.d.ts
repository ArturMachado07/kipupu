import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "cliente" | "operador" | "admin";
      estacaoId?: string;
      estacaoNome?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    clienteId?: string;
    role?: "cliente" | "operador" | "admin";
    estacaoId?: string;
    estacaoNome?: string;
  }
}
