import { addDaysISO, formatDate, todayISO } from './format'

export interface Period {
  /** Texto pronto para o subtítulo: "Últimos 30 dias". */
  label: string
  /** Primeiro dia (inclusive), em ISO. */
  start: string
  /** Último dia (inclusive), em ISO. */
  end: string
  /** Tamanho da janela para trás, em dias. */
  days: number
  /** Janela anterior do mesmo tamanho, para comparar evolução. */
  previous?: { start: string; end: string }
}

/** O filtro é só isto: quantos dias olhar para trás. */
export interface PeriodSelection {
  days: number
  /** Ignora os dias e mostra todo o histórico. */
  all?: boolean
  /** Fatia escolhida tocando numa coluna do gráfico. */
  custom?: { start: string; end: string } | null
}

export const ALL_START = '1900-01-01'
export const ALL_END = '2999-12-31'

export const defaultDays = 30
export const dayPresets = [7, 30, 90]
export const maxDays = 3650

export const defaultSelection: PeriodSelection = { days: defaultDays }

function isoOf(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseISO(value: string) {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Quantidade de dias do intervalo, contando as duas pontas. */
export function daysBetween(start: string, end: string) {
  return Math.round((parseISO(end).getTime() - parseISO(start).getTime()) / 86400000) + 1
}

/**
 * As cobranças semanais são criadas com 4 semanas de antecedência. Se as
 * janelas móveis parassem em "hoje", tudo que ainda vai vencer desapareceria
 * delas — era por isso que "30 dias" vinha vazio enquanto "Este mês" mostrava
 * valores. Por isso elas vão até o mesmo horizonte que o app já agenda.
 */
const SCHEDULED_AHEAD = 28

/** Mantém a quantidade de dias dentro de um intervalo que faz sentido. */
export function clampDays(value: number) {
  if (!Number.isFinite(value)) return defaultDays
  return Math.min(maxDays, Math.max(1, Math.round(value)))
}

export function resolvePeriod(selection: PeriodSelection): Period {
  const today = todayISO()

  // Fatia escolhida no gráfico: vale exatamente o que foi tocado.
  if (selection.custom?.start && selection.custom?.end) {
    const { start, end } = selection.custom
    const days = daysBetween(start, end)
    return {
      label: `${formatDate(start)} a ${formatDate(end)}`,
      start,
      end,
      days,
      previous: { start: addDaysISO(start, -days), end: addDaysISO(start, -1) },
    }
  }

  if (selection.all) {
    return { label: 'Todo o histórico', start: ALL_START, end: ALL_END, days: 0 }
  }

  // Últimos N dias + o que já está agendado. A comparação continua sendo com
  // os N dias imediatamente anteriores, senão a variação perderia o sentido.
  const days = clampDays(selection.days)
  const start = addDaysISO(today, -(days - 1))
  return {
    label: `Últimos ${days} dias`,
    start,
    end: addDaysISO(today, SCHEDULED_AHEAD),
    days,
    previous: { start: addDaysISO(start, -days), end: addDaysISO(start, -1) },
  }
}

// ---------- divisão do período em colunas do gráfico ----------

export interface Bucket {
  start: string
  end: string
  label: string
}

function shortDate(iso: string) {
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}

/**
 * Agrupa o intervalo em dia, semana ou mês, escolhendo a escala que rende
 * poucas colunas legíveis no celular.
 */
export function buildBuckets(start: string, end: string): Bucket[] {
  if (end < start) return []
  const span = daysBetween(start, end)

  if (span <= 16) {
    const buckets: Bucket[] = []
    for (let cursor = start; cursor <= end; cursor = addDaysISO(cursor, 1)) {
      buckets.push({ start: cursor, end: cursor, label: shortDate(cursor) })
    }
    return buckets
  }

  if (span <= 120) {
    const buckets: Bucket[] = []
    for (let cursor = start; cursor <= end; cursor = addDaysISO(cursor, 7)) {
      const last = addDaysISO(cursor, 6)
      buckets.push({ start: cursor, end: last > end ? end : last, label: shortDate(cursor) })
    }
    return buckets
  }

  const buckets: Bucket[] = []
  const first = parseISO(start)
  const last = parseISO(end)
  const multiYear = first.getFullYear() !== last.getFullYear()
  let cursor = new Date(first.getFullYear(), first.getMonth(), 1, 12)

  while (isoOf(cursor) <= end) {
    const monthStart = isoOf(cursor)
    const monthEnd = isoOf(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 12))
    const month = cursor.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    const label = multiYear ? `${month}/${String(cursor.getFullYear()).slice(2)}` : month
    buckets.push({
      start: monthStart < start ? start : monthStart,
      end: monthEnd > end ? end : monthEnd,
      label,
    })
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12)
  }
  return buckets
}
