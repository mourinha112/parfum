// === CONFIGURAÇÕES DA LOJA ===
// Troque aqui o número do WhatsApp. Formato: 55 + DDD + número (sem + ou espaços)
// Exemplo BR: 5511987654321
export const WHATSAPP_NUMBER = "5521966478262";

export const STORE_NAME = "Imperial Parfum";

export function whatsappUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
