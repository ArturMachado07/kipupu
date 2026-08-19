import { randomBytes } from "node:crypto";

/** Gera uma password aleatória, fácil de ler/ditar (só letras e números). */
export function gerarPasswordAleatoria(tamanho = 8): string {
  return randomBytes(Math.ceil(tamanho * 1.5))
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, tamanho);
}
