/**
 * Envio de credenciais + link do mapa via WhatsApp (Processo 2, Passo 2).
 *
 * Stub por agora: regista no log em vez de chamar a WhatsApp Business API.
 * Para produção, substituir o corpo desta função por uma chamada real à
 * Cloud API do WhatsApp (Meta), usando WHATSAPP_API_TOKEN e
 * WHATSAPP_PHONE_NUMBER_ID definidos em .env.
 */
export async function enviarWhatsAppAcesso(params: {
  numeroWhatsapp: string;
  nomeCliente: string;
  linkMapa: string;
}): Promise<{ enviado: boolean }> {
  const mensagem =
    `Olá ${params.nomeCliente}! O teu pagamento KIPUPU foi confirmado. ` +
    `Acede à tua conta e vê as estações disponíveis aqui: ${params.linkMapa}`;

  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log("[WhatsApp stub] Para:", params.numeroWhatsapp, "-", mensagem);
    return { enviado: false };
  }

  // Exemplo de integração real (Meta WhatsApp Cloud API) — descomentar e
  // ajustar quando houver token/phone_number_id válidos:
  //
  // const resp = await fetch(
  //   `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
  //   {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       messaging_product: "whatsapp",
  //       to: params.numeroWhatsapp,
  //       type: "text",
  //       text: { body: mensagem },
  //     }),
  //   }
  // );
  // return { enviado: resp.ok };

  return { enviado: false };
}
