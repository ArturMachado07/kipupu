/**
 * KIPUPU — adicionar uma estação parceira real + conta de operador.
 *
 * Usa isto sempre que fechares uma parceria com uma estação de lavagem a
 * sério (fora dos dados de exemplo do `seed.ts`). Corre de forma
 * interativa — vai fazendo perguntas no terminal — e no fim cria:
 *   1. O Município e o Distrito (se ainda não existirem na base de dados)
 *   2. A Estação, com morada e coordenadas GPS reais
 *   3. A conta de login do operador dessa estação (para usar em
 *      /estacao/login e /estacao/painel)
 *
 * Como correr:
 *   cd webapp
 *   npx tsx prisma/add-estacao.ts
 *
 * Dica para obter a latitude/longitude reais: abre a estação no Google
 * Maps, clica com o botão direito no ponto exato → aparecem as
 * coordenadas no topo do menu (ex.: -8.9712, 13.2893) → cola aqui
 * separadas (latitude primeiro, depois a longitude).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const rl = createInterface({ input: process.stdin, output: process.stdout });

async function perguntar(pergunta: string, obrigatorio = true, valorPorOmissao?: string): Promise<string> {
  while (true) {
    const sufixo = valorPorOmissao ? ` [${valorPorOmissao}]` : "";
    const resposta = (await rl.question(`${pergunta}${sufixo}: `)).trim();

    if (!resposta && valorPorOmissao) return valorPorOmissao;
    if (!resposta && !obrigatorio) return "";
    if (!resposta) {
      console.log("  → este campo é obrigatório, tenta outra vez.");
      continue;
    }
    return resposta;
  }
}

async function perguntarNumero(pergunta: string): Promise<number> {
  while (true) {
    const resposta = await perguntar(pergunta);
    const numero = Number(resposta.replace(",", "."));
    if (Number.isFinite(numero)) return numero;
    console.log("  → introduz um número válido (ex.: -8.9712).");
  }
}

async function perguntarInteiro(pergunta: string, valorPorOmissao: number): Promise<number> {
  const resposta = await perguntar(pergunta, false, String(valorPorOmissao));
  const numero = Number.parseInt(resposta, 10);
  return Number.isInteger(numero) && numero > 0 ? numero : valorPorOmissao;
}

function gerarPasswordAleatoria(): string {
  // 8 carateres alfanuméricos, fáceis de ler/ditar ao telefone
  return randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
}

async function main() {
  console.log("\n=== KIPUPU — adicionar estação parceira ===\n");

  // -----------------------------------------------------------------
  // 1. Geografia (Município > Distrito)
  // -----------------------------------------------------------------
  const nomeMunicipio = await perguntar("Município (ex.: Kilamba Kiaxi)");
  const nomeDistrito = await perguntar("Distrito / bairro (ex.: Nova Vida)");

  const municipio = await prisma.municipio.upsert({
    where: { nome: nomeMunicipio },
    update: {},
    create: { nome: nomeMunicipio },
  });

  const distrito = await prisma.distrito.upsert({
    where: { municipioId_nome: { municipioId: municipio.id, nome: nomeDistrito } },
    update: {},
    create: { nome: nomeDistrito, municipioId: municipio.id },
  });

  // -----------------------------------------------------------------
  // 2. Dados da estação
  // -----------------------------------------------------------------
  const nomeEstacao = await perguntar("Nome da estação (como vai aparecer para o cliente)");
  const morada = await perguntar("Morada / referência completa");

  console.log("\nCoordenadas GPS (vai ao Google Maps, botão direito no local exato da estação):");
  const latitude = await perguntarNumero("  Latitude (ex.: -8.9712)");
  const longitude = await perguntarNumero("  Longitude (ex.: 13.2893)");

  const horario = await perguntar("Horário de funcionamento", false, "Seg–Sáb, 08:00–18:00");
  const telefone = await perguntar("Telefone de contacto da estação (opcional)", false);
  const capacidade = await perguntarInteiro("Nº de baias/lugares de lavagem em simultâneo", 1);

  // -----------------------------------------------------------------
  // 3. Conta do operador (login em /estacao/login)
  // -----------------------------------------------------------------
  console.log("\nConta de acesso do funcionário desta estação (para ler o QR code em /estacao/painel):");
  const nomeOperador = await perguntar("Nome do operador/responsável");
  const emailOperador = await perguntar("Email de login do operador");

  const operadorExistente = await prisma.operadorEstacao.findUnique({ where: { email: emailOperador } });
  if (operadorExistente) {
    console.log(`\n⚠️  Já existe um operador com o email "${emailOperador}". Nada foi criado. Corre o script outra vez com um email diferente.`);
    return;
  }

  const passwordEscolhida = await perguntar(
    "Password do operador (deixa em branco para gerar uma automaticamente)",
    false
  );
  const passwordFinal = passwordEscolhida || gerarPasswordAleatoria();

  // -----------------------------------------------------------------
  // Confirmação antes de gravar
  // -----------------------------------------------------------------
  console.log("\n--- Confirma os dados antes de gravar ---");
  console.log(`Estação:    ${nomeEstacao}`);
  console.log(`Morada:     ${morada}`);
  console.log(`Localização: ${nomeDistrito}, ${nomeMunicipio}`);
  console.log(`Coordenadas: ${latitude}, ${longitude}`);
  console.log(`Horário:    ${horario}`);
  console.log(`Capacidade: ${capacidade}`);
  console.log(`Operador:   ${nomeOperador} <${emailOperador}>`);
  const confirmar = await perguntar("\nGravar na base de dados? (sim/não)", false, "sim");

  if (confirmar.toLowerCase() !== "sim" && confirmar.toLowerCase() !== "s") {
    console.log("Cancelado — nada foi gravado.");
    return;
  }

  const estacao = await prisma.estacao.create({
    data: {
      nome: nomeEstacao,
      morada,
      distritoId: distrito.id,
      latitude,
      longitude,
      horario,
      telefone: telefone || null,
      capacidade,
      ativa: true,
    },
  });

  const passwordHash = await bcrypt.hash(passwordFinal, 10);
  await prisma.operadorEstacao.create({
    data: {
      nome: nomeOperador,
      email: emailOperador,
      passwordHash,
      estacaoId: estacao.id,
    },
  });

  console.log("\n✅ Estação e conta de operador criadas com sucesso!\n");
  console.log(`Estação "${estacao.nome}" já aparece no mapa do Processo 1 e na busca por proximidade do Processo 2.`);
  console.log("\nCredenciais de acesso do operador (partilha com a estação em pessoa ou por um canal seguro):");
  console.log(`  URL:      /estacao/login`);
  console.log(`  Email:    ${emailOperador}`);
  console.log(`  Password: ${passwordFinal}`);
  console.log("\nRecomenda-se que o operador mude a password depois do primeiro acesso (funcionalidade ainda por construir — por agora, corre este script para recriar a conta se precisares de trocar a password).");
}

main()
  .catch((e) => {
    console.error("\n❌ Ocorreu um erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
