import { randomInt } from "crypto";

/**
 * Gera uma referência de pagamento no formato usado pelo Multicaixa (entidade + referência).
 * Placeholder até existir integração real com a EMIS (ver EMIS_POS_ID em .env.example).
 */
export function gerarReferenciaPagamento(): { entidade: string; referencia: string } {
  const entidade = "00360"; // exemplo — substituir pela entidade real atribuída pela EMIS
  const referencia = String(randomInt(100000000, 999999999));
  return { entidade, referencia };
}
