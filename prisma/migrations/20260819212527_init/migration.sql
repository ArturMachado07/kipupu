-- CreateTable
CREATE TABLE "Municipio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distrito" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Distrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "morada" TEXT NOT NULL,
    "distritoId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "horario" TEXT NOT NULL,
    "telefone" TEXT,
    "capacidade" INTEGER NOT NULL DEFAULT 1,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperadorEstacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "estacaoId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperadorEstacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "whatsapp" TEXT,
    "estadoConta" TEXT NOT NULL DEFAULT 'ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pacote" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "precoMensal" INTEGER NOT NULL,
    "lavagensMes" INTEGER NOT NULL,
    "beneficios" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscricao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "pacoteId" TEXT NOT NULL,
    "estacaoId" TEXT,
    "ambitoUso" TEXT NOT NULL DEFAULT 'rede_aberta',
    "estado" TEXT NOT NULL DEFAULT 'pendente',
    "dataInicio" TIMESTAMP(3),
    "dataRenovacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "subscricaoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "metodo" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendente',
    "referencia" TEXT,
    "faturaPdfPath" TEXT,
    "confirmadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartaoDigital" (
    "id" TEXT NOT NULL,
    "subscricaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "qrDataUrl" TEXT NOT NULL,
    "validade" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartaoDigital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lavagem" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "estacaoId" TEXT NOT NULL,
    "subscricaoId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lavagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_nome_key" ON "Municipio"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Distrito_municipioId_nome_key" ON "Distrito"("municipioId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "OperadorEstacao_email_key" ON "OperadorEstacao"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pacote_nome_key" ON "Pacote"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Pacote_slug_key" ON "Pacote"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CartaoDigital_subscricaoId_key" ON "CartaoDigital"("subscricaoId");

-- CreateIndex
CREATE UNIQUE INDEX "CartaoDigital_codigo_key" ON "CartaoDigital"("codigo");

-- AddForeignKey
ALTER TABLE "Distrito" ADD CONSTRAINT "Distrito_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estacao" ADD CONSTRAINT "Estacao_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES "Distrito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperadorEstacao" ADD CONSTRAINT "OperadorEstacao_estacaoId_fkey" FOREIGN KEY ("estacaoId") REFERENCES "Estacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscricao" ADD CONSTRAINT "Subscricao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscricao" ADD CONSTRAINT "Subscricao_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "Pacote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscricao" ADD CONSTRAINT "Subscricao_estacaoId_fkey" FOREIGN KEY ("estacaoId") REFERENCES "Estacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_subscricaoId_fkey" FOREIGN KEY ("subscricaoId") REFERENCES "Subscricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoDigital" ADD CONSTRAINT "CartaoDigital_subscricaoId_fkey" FOREIGN KEY ("subscricaoId") REFERENCES "Subscricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lavagem" ADD CONSTRAINT "Lavagem_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lavagem" ADD CONSTRAINT "Lavagem_estacaoId_fkey" FOREIGN KEY ("estacaoId") REFERENCES "Estacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lavagem" ADD CONSTRAINT "Lavagem_subscricaoId_fkey" FOREIGN KEY ("subscricaoId") REFERENCES "Subscricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
