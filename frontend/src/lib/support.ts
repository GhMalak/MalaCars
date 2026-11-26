import { normalizeWhatsApp, whatsappUrl } from './whatsapp'

/**
 * Canal de atendimento da Athena Frotas.
 * Troque o número aqui ou defina VITE_SUPPORT_WHATSAPP no ambiente.
 * Sem número configurado, os botões de suporte simplesmente não aparecem.
 */
const FALLBACK_WHATSAPP = ''

const configured = (import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined) || FALLBACK_WHATSAPP

export const supportPhone = normalizeWhatsApp(configured)
export const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || ''

export function supportUrl(context?: string) {
  if (!supportPhone) return null
  const message = context
    ? `Olá! Preciso de ajuda com o Athena Frotas (${context}).`
    : 'Olá! Preciso de ajuda com o Athena Frotas.'
  return whatsappUrl(supportPhone, message)
}
