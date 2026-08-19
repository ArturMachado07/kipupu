import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Coordenadas aproximadas do bairro Nova Vida, Município de Kilamba Kiaxi, Luanda.
// Ajustar com coordenadas reais de cada estação parceira assim que o contrato for fechado.
const NOVA_VIDA_CENTRO = { lat: -8.973, lng: 13.287 };

function pontoProximo(offsetLat: number, offsetLng: number) {
  return {
    latitude: NOVA_VIDA_CENTRO.lat + offsetLat,
    longitude: NOVA_VIDA_CENTRO.lng + offsetLng,
  };
}

async function main() {
  console.log("Semear dados base da KIPUPU...");

  // ---------------------------------------------------------------------
  // Geografia: Município > Distrito > 6 Estações (exemplo do fluxo Processo 1)
  // ---------------------------------------------------------------------
  const municipio = await prisma.municipio.upsert({
    where: { nome: "Kilamba Kiaxi" },
    update: {},
    create: { nome: "Kilamba Kiaxi" },
  });

  const distrito = await prisma.distrito.upsert({
    where: { municipioId_nome: { municipioId: municipio.id, nome: "Nova Vida" } },
    update: {},
    create: { nome: "Nova Vida", municipioId: municipio.id },
  });

  const estacoesSeed = [
    { nome: "KIPUPU Ponto Nova Vida Norte", offset: [0.006, -0.004] },
    { nome: "KIPUPU Ponto Nova Vida Sul", offset: [-0.007, 0.002] },
    { nome: "KIPUPU Ponto Avenida Principal", offset: [0.001, 0.006] },
    { nome: "KIPUPU Ponto Mercado Nova Vida", offset: [-0.003, -0.006] },
    { nome: "KIPUPU Ponto Zango Acesso", offset: [0.009, 0.007] },
    { nome: "KIPUPU Ponto Via Expresso", offset: [-0.008, -0.009] },
  ] as const;

  const estacoes = [];
  for (const item of estacoesSeed) {
    const { latitude: lat, longitude: lng } = pontoProximo(item.offset[0], item.offset[1]);
    const estacao = await prisma.estacao.upsert({
      where: { id: item.nome.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: item.nome.toLowerCase().replace(/\s+/g, "-"),
        nome: item.nome,
        morada: `Rua de exemplo, Bairro Nova Vida, Kilamba Kiaxi, Luanda`,
        distritoId: distrito.id,
        latitude: lat,
        longitude: lng,
        horario: "Seg–Sáb, 08:00–18:00",
        telefone: "+244 900 000 000",
        capacidade: 2,
        ativa: true,
      },
    });
    estacoes.push(estacao);
  }

  // ---------------------------------------------------------------------
  // Pacotes (Passo 5 do Processo 1 / pop-up do Processo 2)
  // ---------------------------------------------------------------------
  await prisma.pacote.upsert({
    where: { slug: "basico" },
    update: {},
    create: {
      nome: "Básico",
      slug: "basico",
      descricao: "Ideal para quem lava o carro ocasionalmente.",
      precoMensal: 6000,
      lavagensMes: 4,
      beneficios: "4 lavagens por mês|Lavagem exterior completa|Válido em qualquer estação parceira",
      ordem: 1,
    },
  });

  await prisma.pacote.upsert({
    where: { slug: "intermedio" },
    update: {},
    create: {
      nome: "Intermédio",
      slug: "intermedio",
      descricao: "O mais escolhido — equilíbrio entre frequência e preço.",
      precoMensal: 10000,
      lavagensMes: 8,
      beneficios: "8 lavagens por mês|Lavagem exterior e interior|Aspiração incluída|Válido em qualquer estação parceira",
      ordem: 2,
    },
  });

  await prisma.pacote.upsert({
    where: { slug: "premium" },
    update: {},
    create: {
      nome: "Premium",
      slug: "premium",
      descricao: "Para quem quer o carro sempre impecável.",
      precoMensal: 16000,
      lavagensMes: 0,
      beneficios: "Lavagens ilimitadas*|Lavagem exterior, interior e motor|Aspiração e perfume incluídos|Prioridade de atendimento|Válido em qualquer estação parceira",
      ordem: 3,
    },
  });

  // ---------------------------------------------------------------------
  // Cliente de demonstração (para testar login sem passar pelo registo)
  // ---------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("kipupu123", 10);
  await prisma.cliente.upsert({
    where: { email: "demo@kipupu.ao" },
    update: {},
    create: {
      nome: "Cliente Demo",
      email: "demo@kipupu.ao",
      passwordHash,
      whatsapp: "+244900000000",
    },
  });

  // ---------------------------------------------------------------------
  // Operador de demonstração (login do painel /estacao/painel), ligado à
  // primeira estação semeada.
  // ---------------------------------------------------------------------
  const operadorPasswordHash = await bcrypt.hash("estacao123", 10);
  await prisma.operadorEstacao.upsert({
    where: { email: "operador@kipupu.ao" },
    update: {},
    create: {
      nome: "Operador Demo",
      email: "operador@kipupu.ao",
      passwordHash: operadorPasswordHash,
      estacaoId: estacoes[0].id,
    },
  });

  // ---------------------------------------------------------------------
  // Conta de administrador (login do painel /admin/estacoes).
  // ---------------------------------------------------------------------
  const adminPasswordHash = await bcrypt.hash("kipupu123", 10);
  await prisma.admin.upsert({
    where: { email: "admin@kipupu.ao" },
    update: {},
    create: {
      nome: "Administração KIPUPU",
      email: "admin@kipupu.ao",
      passwordHash: adminPasswordHash,
    },
  });

  console.log("Seed concluído:");
  console.log(`  Município: ${municipio.nome}`);
  console.log(`  Distrito: ${distrito.nome}`);
  console.log(`  Estações: ${estacoes.length}`);
  console.log(`  Login cliente demo -> email: demo@kipupu.ao | password: kipupu123`);
  console.log(
    `  Login operador demo -> email: operador@kipupu.ao | password: estacao123 (estação: ${estacoes[0].nome})`
  );
  console.log(`  Login admin -> email: admin@kipupu.ao | password: kipupu123 (MUDA esta password em produção)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
