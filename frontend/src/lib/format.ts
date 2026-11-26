export function money(value?: number | null) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR')
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatKm(value?: number | null) {
  return `${Number(value || 0).toLocaleString('pt-BR')} km`
}

/** Valor curto para rótulos apertados: 1,2 mil em vez de R$ 1.200,00. */
export function moneyShort(value?: number | null) {
  const amount = Number(value || 0)
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  }
  return amount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

export const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function weekdayName(index?: number | null) {
  return weekdays[Number(index ?? 1)] || '—'
}

export function todayISO() {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function addDaysISO(value: string, days: number) {
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Mesma data em outro mês, encolhendo o dia quando o mês é mais curto. */
export function addMonthsISO(iso: string, months: number) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const target = new Date(y, m - 1 + months, 1, 12)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d, lastDay))
  const month = String(target.getMonth() + 1).padStart(2, '0')
  const day = String(target.getDate()).padStart(2, '0')
  return `${target.getFullYear()}-${month}-${day}`
}

/** Diferença em dias entre duas datas ISO (positivo = `to` é depois). */
export function diffDays(from: string, to: string) {
  const [y1, m1, d1] = from.slice(0, 10).split('-').map(Number)
  const [y2, m2, d2] = to.slice(0, 10).split('-').map(Number)
  const a = new Date(y1, m1 - 1, d1, 12).getTime()
  const b = new Date(y2, m2 - 1, d2, 12).getTime()
  return Math.round((b - a) / 86400000)
}

/** Dias até a data (negativo = já passou). */
export function daysUntil(value?: string | null) {
  if (!value) return null
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  const target = new Date(y, m - 1, d, 12).getTime()
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.round((target - now.getTime()) / 86400000)
}

/** Texto curto de prazo: "vence em 5 dias", "venceu há 3 dias", "vence hoje". */
export function deadlineLabel(value?: string | null) {
  const days = daysUntil(value)
  if (days === null) return 'sem data'
  if (days === 0) return 'vence hoje'
  if (days > 0) return `vence em ${days} ${days === 1 ? 'dia' : 'dias'}`
  const late = Math.abs(days)
  return `venceu há ${late} ${late === 1 ? 'dia' : 'dias'}`
}

/** Semana corrente de segunda a domingo. */
export function currentWeek() {
  const today = todayISO()
  const [y, m, d] = today.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12)
  const offset = (date.getDay() + 6) % 7
  const start = addDaysISO(today, -offset)
  return { start, end: addDaysISO(start, 6) }
}
