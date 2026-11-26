import { formatDate, money } from './format'

export const formatDateBR = formatDate
export const moneyBR = money

export function normalizeWhatsApp(phone?: string | null) {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  if (!digits.startsWith('55') || digits.length < 12) return null
  return digits
}

export function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(phone: string | null, message: string) {
  if (!phone) {
    throw new Error('Este motorista não tem telefone cadastrado.')
  }
  window.open(whatsappUrl(phone, message), '_blank', 'noopener,noreferrer')
}

export function paymentReminder(opts: { name: string; plate: string; date: string; amount: number }) {
  return [
    `Olá, ${opts.name}!`,
    `Lembrete Athena Frotas: o pagamento semanal do veículo ${opts.plate} vence ${opts.date === 'amanhã' ? 'amanhã' : `em ${opts.date}`}, no valor de ${moneyBR(opts.amount)}.`,
    'Qualquer dúvida, estamos à disposição.',
  ].join('\n\n')
}

export function overdueReminder(opts: { name: string; plate: string; date: string; amount: number }) {
  return [
    `Olá, ${opts.name}!`,
    `Lembrete Athena Frotas: o pagamento semanal do veículo ${opts.plate} venceu em ${opts.date} e ainda está em aberto (${moneyBR(opts.amount)}).`,
    'Pode nos confirmar o pagamento ou o comprovante?',
  ].join('\n\n')
}

export function maintenanceReminder(opts: { name: string; plate: string; type: string; date: string }) {
  return [
    `Olá, ${opts.name}!`,
    `Lembrete Athena Frotas: manutenção de ${opts.type} do veículo ${opts.plate} está prevista para ${opts.date}.`,
    'Combine conosco o melhor horário.',
  ].join('\n\n')
}

export function cnhReminder(opts: { name: string; date: string }) {
  return [
    `Olá, ${opts.name}!`,
    `Lembrete Athena Frotas: sua CNH vence em ${opts.date}.`,
    'Regularize para continuar rodando sem interrupção.',
  ].join('\n\n')
}
