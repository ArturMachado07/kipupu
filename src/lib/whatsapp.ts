/**
 * Envio de mensagens via WhatsApp Business Cloud API (Meta).
 *
 * Funciona em modo *stub* (regista no log em vez de enviar) enquanto
 * `WHATSAPP_API_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` não estiverem definidos
 * em `.env` — assim que os preencheres, o envio passa a ser real
 * automaticamente, sem precisares de mudar mais nenhum código. Ver README
 * ("WhatsApp Business API") para o passo a passo de como obter estas duas
 * credenciais no Meta for Developers.
 */
async function enviarMensagemWhatsApp(
  numeroWhatsapp: string,
  mensagem: string
): Promise<{ enviado: boolean }> {
  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log("[WhatsApp stub] Para:", numeroWhatsapp, "-", mensagem);
    return { enviado: false };
  }

  try {
    const resposta = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          // A Cloud API espera o número só com dígitos (código do país + número, sem "+" nem espaços).
          to: numeroWhatsapp.replace(/[^\d]/g, ""),
          type: "text",
          text: { body: mensagem },
        }),
      }
    );

    if (!resposta.ok) {
      console.error(
        "[WhatsApp] Falha ao enviar:",
        resposta.status,
        await resposta.text().catch(() => "")
      );
    }

    return { enviado: resposta.ok };
  } catch (erro) {
    console.error("[WhatsApp] Erro de rede ao enviar:", erro);
    return { enviado: false };
  }
}

/** Processo 2, Passo 2 — após confirmação de pagamento, envia o link do mapa ao cliente. */
export async function enviarWhatsAppAcesso(params: {
  numeroWhatsapp: string;
  nomeCliente: string;
  linkMapa: string;
}): Promise<{ enviado: boolean }> {
  const mensagem =
    `Olá ${params.nomeCliente}! O teu pagamento KIPUPU foi confirmado. ` +
    `Acede à tua conta e vê as estações disponíveis aqui: ${params.linkMapa}`;

  return enviarMensagemWhatsApp(params.numeroWhatsapp, mensagem);
}

/**
 * Painel /admin/estacoes/nova — envia ao operador de uma estação recém-criada
 * as credenciais de acesso ao painel (/estacao/login), assim que o admin
 * preenche o número de WhatsApp do operador no formulário.
 */
export async function enviarWhatsAppCredenciaisOperador(params: {
  numeroWhatsapp: string;
  nomeOperador: string;
  nomeEstacao: string;
  email: string;
  password: string;
}): Promise<{ enviado: boolean }> {
  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/estacao/login`;
  const mensagem =
    `Olá ${params.nomeOperador}! A estação "${params.nomeEstacao}" já está registada na KIPUPU.\n\n` +
    `Acede ao painel em: ${loginUrl}\n` +
    `Email: ${params.email}\n` +
    `Password: ${params.password}\n\n` +
    `Recomendamos mudares a password assim que possível.`;

  return enviarMensagemWhatsApp(params.numeroWhatsapp, mensagem);
}
