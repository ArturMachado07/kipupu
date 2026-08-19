# KIPUPU — Webapp

Implementação fullstack dos dois processos definidos em
`../docs/product/fluxos-utilizacao.md`: seleção manual da estação no mapa
(Processo 1) e adesão rápida via login + geolocalização (Processo 2).

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS** (tokens de marca em `tailwind.config.ts`)
- **Prisma** + **PostgreSQL** (Vercel Postgres / Neon — ver secção "Deploy" abaixo)
- **NextAuth** (credenciais, email + password) para autenticação
- **Leaflet / React-Leaflet** com tiles OpenStreetMap (mapa sem chave paga)
- **qrcode** + **pdf-lib** para gerar o QR code, o cartão digital em PDF e a fatura em PDF

## ⚠️ Nota importante sobre este código

Este projeto foi escrito à mão, ficheiro a ficheiro, dentro de um ambiente
sem acesso à internet/registos de pacotes (política de rede da organização
bloqueia `registry.npmjs.org`). Por isso **não foi possível correr
`npm install` nem `next build` dentro desse ambiente** para uma verificação
completa de compilação.

O que *foi* verificado nesse ambiente, usando ferramentas já instaladas
localmente:
- A lógica pura (`src/lib/geo.ts` — fórmula de Haversine e ordenação por
  proximidade) foi executada e validada com casos de teste reais de Luanda.
- A geração de PDF (`src/lib/pdf-cartao.ts` e `src/lib/pdf-fatura.ts`) foi
  executada de facto com `pdf-lib`, gerando PDFs válidos — o layout foi
  inspecionado visualmente.
- Todo o código TypeScript/TSX foi passado pelo compilador `tsc` e não
  apresentou erros de sintaxe.

O que falta confirmar és tu, correndo os 3 comandos abaixo na tua máquina
(onde tens internet normal) — nessa altura teremos a confirmação final de
que tudo compila e corre ponta a ponta.

## Arranque local

Precisas de uma base de dados Postgres já criada (ver "Deploy" abaixo — a
mesma base de dados da Vercel pode ser usada em desenvolvimento, ou podes
criar uma só para dev num destes serviços gratuitos: Vercel Postgres, Neon,
Supabase).

```bash
cd webapp
cp .env.example .env          # cola aqui a POSTGRES_PRISMA_URL e a POSTGRES_URL_NON_POOLING
                                # (ou corre `vercel env pull .env` depois de ligares o projeto à Vercel)
npm install
npx prisma migrate dev --name init
npm run prisma:seed           # popula Kilamba Kiaxi / Nova Vida / 6 estações / 3 pacotes / contas demo
npm run dev
```

Abre http://localhost:3000

**Contas de demonstração** (criadas pelo seed):
- Cliente: `demo@kipupu.ao` / `kipupu123`
- Operador de estação (`/estacao/login`): `operador@kipupu.ao` / `estacao123`

## Estrutura

```
webapp/
├── prisma/
│   ├── schema.prisma      # Município, Distrito, Estação, Cliente, Pacote,
│   │                       Subscrição, Pagamento, CartaoDigital, Lavagem
│   └── seed.ts             # dados de exemplo (Kilamba Kiaxi > Nova Vida > 6 estações)
├── public/brand/           # logos e ícones da identidade visual
└── src/
    ├── app/
    │   ├── page.tsx                    # landing page
    │   ├── login/, registo/            # autenticação
    │   ├── processo-1/page.tsx         # Município → Distrito → Estação → Pacote → Pagamento → Cartão
    │   ├── dashboard/page.tsx          # Processo 2: login → pacotes/pagamento → localizar estação → cartão
    │   ├── cartao/[id]/page.tsx        # vista direta e partilhável do cartão digital
    │   └── api/                        # todas as rotas (municípios, distritos, estações,
    │                                     pacotes, subscrições, pagamentos, cartão, fatura, auth)
    ├── components/                     # Mapa (Leaflet), pop-ups dos passos 4/5/6, cartão digital, leitor de QR
    └── lib/                            # prisma, auth, geo (Haversine), qrcode, pdf-cartao, pdf-fatura,
                                          referencia (mock Multicaixa), whatsapp (stub)
```

## Painel da estação (`/estacao`)

Área separada, com sessão própria (não a mesma do cliente), para o funcionário da estação parceira ler o cartão digital e confirmar a lavagem:

- `/estacao/login` — login do operador (conta `OperadorEstacao`, ligada a uma `Estacao`).
- `/estacao/painel` — lê o QR code pela câmara do telemóvel/computador (`components/LeitorQr.tsx`, usa `jsqr`, sem serviços pagos) ou aceita o código escrito à mão; mostra os dados do cliente e do pacote, valida se a subscrição está ativa, se o cartão não expirou, se o âmbito de uso permite lavar ali, e se ainda há lavagens disponíveis este mês; só depois de o operador confirmar é que a lavagem fica registada.
- Conta de demonstração (criada pelo seed): `operador@kipupu.ao` / `estacao123`, ligada à primeira das 6 estações semeadas.

**Importante:** como o `schema.prisma` ganhou um modelo novo (`OperadorEstacao`), depois de atualizares o código precisas de correr outra migração:

```bash
npx prisma migrate dev --name operador-estacao
npm run prisma:seed
```

## Como os passos do documento de fluxos mapeiam para o código

| Passo (Processo 1) | Onde está |
|---|---|
| 1–3 Selecionar Município/Distrito/Estação | `app/processo-1/page.tsx` + `MapaLuanda.tsx` + rotas `api/municipios`, `api/municipios/[id]/distritos`, `api/distritos/[id]/estacoes` |
| 4 Detalhes da estação | `components/PopupDetalhesEstacao.tsx` |
| 5 Selecionar pacote | `components/PopupPacotes.tsx` + `api/pacotes` |
| 6 Pagamento + fatura PDF | `components/PopupPagamento.tsx` + `api/pagamentos` + `api/pagamentos/[id]/fatura` |
| 7 Cartão digital | `api/cartao/[subscricaoId]` + `lib/qrcode.ts` + `lib/pdf-cartao.ts` |
| 8 Lavagem | `app/estacao/painel/page.tsx` + `api/estacao/validar-cartao` + `api/estacao/confirmar-lavagem` (o operador lê o QR, confirma, e só aí se cria o registo `Lavagem`) |

| Passo (Processo 2) | Onde está |
|---|---|
| 1 Login + pop-up pacotes | `app/dashboard/page.tsx` (fluxo automático ao entrar) |
| 2 Confirmação pagamento + WhatsApp | `api/pagamentos/[id]/confirmar` + `lib/whatsapp.ts` (stub, pronto a ligar à Cloud API) |
| 3 Localizar estação (geolocalização) | `navigator.geolocation` no dashboard + `api/estacoes?lat=&lng=` + `lib/geo.ts` |
| 4 Gerar cartão digital | igual ao Passo 7 do Processo 1 |
| 5 Usufruir do serviço | `app/estacao/painel/page.tsx` (mesmo ponto do Passo 8 acima) |

## Decisões de produto já assumidas no código (ver `docs/product/fluxos-utilizacao.md`)

- **Âmbito de uso**: por omissão, o cartão vale em **qualquer estação da rede**
  (`ambitoUso = "rede_aberta"`), como sugerido no texto inicial da marca. É
  possível restringir a uma única estação (`"estacao_unica"`) se a decisão de
  negócio for essa.
- **Validação na estação**: padronizado em **QR code** nos dois processos.
- **Pagamento**: referência Multicaixa é atualmente **gerada localmente** (mock,
  ver `lib/referencia.ts`) — falta a integração real com a EMIS para uma
  entidade/referência válidas de facto e um webhook de confirmação automática.
  Transferência bancária mostra os dados estáticos definidos em `.env`.
- **WhatsApp**: o envio de credenciais/link está em modo *stub* (regista no
  log). Para produção, preencher `WHATSAPP_API_TOKEN` e
  `WHATSAPP_PHONE_NUMBER_ID` e descomentar a chamada em `lib/whatsapp.ts`.

## Próximos passos sugeridos

1. ~~Correr os 3 comandos de arranque local e confirmar que tudo compila.~~ ✓ confirmado.
2. ~~Construir o painel da estação para ler o QR code e confirmar a lavagem.~~ ✓ feito (`/estacao/painel`).
3. Substituir as coordenadas de exemplo das 6 estações de Nova Vida pelas
   coordenadas reais assim que os contratos com as estações parceiras forem
   fechados.
4. Integrar a EMIS (Multicaixa Express) para referências reais e webhook de
   confirmação automática de pagamento.
5. Ligar a WhatsApp Business API.
6. Dar ao operador uma forma de criar/gerir as suas próprias contas
   (`OperadorEstacao`) — hoje só existem via seed; provavelmente um painel de
   administração da KIPUPU (fora do âmbito deste MVP) que cria a conta do
   operador ao fechar contrato com cada estação parceira.

## Deploy (GitHub + Vercel)

Os comandos `git` abaixo têm de ser corridos no teu Terminal/VSCode normal
(não a partir de uma pasta ligada por uma ponte remota) — o Git precisa de
escrever/apagar ficheiros internos livremente.

### 1. Enviar o código para o GitHub

Dentro de `Kipupu/webapp`:

```bash
git init
git add -A
git commit -m "KIPUPU webapp — MVP inicial"
```

Se pedir identidade (só na primeira vez que usas o Git nesta máquina):

```bash
git config --global user.name "O teu nome"
git config --global user.email "o-teu-email@exemplo.com"
```

Cria um repositório vazio em https://github.com/new (sem README/gitignore —
já tens os teus), depois:

```bash
git remote add origin https://github.com/<o-teu-utilizador>/kipupu-webapp.git
git branch -M main
git push -u origin main
```

(Se tiveres o GitHub CLI instalado, `gh repo create kipupu-webapp --private --source=. --remote=origin --push` faz tudo isto num comando só.)

### 2. Criar o projeto na Vercel

1. Em https://vercel.com → **Add New → Project** → importa o repositório `kipupu-webapp`.
2. A Vercel deteta Next.js automaticamente — não precisas de mudar nada nas definições de build.
3. Antes de clicares em Deploy, adiciona estas variáveis de ambiente (Settings → Environment Variables), copiadas do teu `.env`:
   - `NEXTAUTH_SECRET`
   - `KIPUPU_IBAN`, `KIPUPU_BANCO`, `KIPUPU_TITULAR`
   - `NEXTAUTH_URL` — deixa em branco por agora, atualizas no passo 4
4. Clica **Deploy**. Este primeiro deploy pode falhar ou ficar no ar sem base de dados ligada — é esperado, o próximo passo resolve isso.

### 3. Ligar uma base de dados Postgres

No projeto, na aba **Storage** → **Create Database** → **Postgres**, segue o
assistente e liga-a ao projeto. A Vercel injeta automaticamente
`POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING` (entre outras) nas
variáveis de ambiente — é exatamente o que o `prisma/schema.prisma` já espera.

### 4. Criar as tabelas e popular a base de dados

Localmente, dentro de `webapp`:

```bash
npx vercel link          # liga esta pasta ao projeto que criaste na Vercel
npx vercel env pull .env # copia as variáveis reais (incluindo as da Postgres) para .env
npx prisma migrate dev --name init
npm run prisma:seed
```

### 5. Fechar o ciclo

1. Copia o domínio que a Vercel deu ao projeto (ex.: `kipupu-webapp.vercel.app`).
2. Em Settings → Environment Variables, define `NEXTAUTH_URL=https://kipupu-webapp.vercel.app`.
3. Faz um novo deploy (Deployments → ⋯ → Redeploy, ou basta um `git push` de qualquer alteração).
4. Testa em produção: landing page, `/processo-1`, `/dashboard`, e `/estacao/login`.

A partir daqui, qualquer `git push` para `main` faz deploy automático — é
assim que vais publicar todas as próximas alterações.
