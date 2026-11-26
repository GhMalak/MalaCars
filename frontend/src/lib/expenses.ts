import { api } from './api'
import { addMonthsISO, todayISO } from './format'
import type { DateRange, Expense, Maintenance, RecurringExpense } from './fleet'

export const expenseCategories = [
  { value: 'seguro', label: 'Seguro' },
  { value: 'financiamento', label: 'Financiamento' },
  { value: 'ipva', label: 'IPVA' },
  { value: 'licenciamento', label: 'Licenciamento' },
  { value: 'rastreador', label: 'Rastreador' },
  { value: 'combustivel', label: 'Combustível' },
  { value: 'multa', label: 'Multa' },
  { value: 'outros', label: 'Outros' },
]

export function categoryLabel(value: string) {
  return expenseCategories.find((c) => c.value === value)?.label || 'Outros'
}

// ---------- geração das despesas fixas ----------

/** Todo dia `day` de cada mês dentro do intervalo. */
export function monthlyDates(from: string, to: string, day: number) {
  const dates: string[] = []
  const safeDay = Math.min(28, Math.max(1, day))
  let cursor = `${from.slice(0, 7)}-${String(safeDay).padStart(2, '0')}`
  if (cursor < from) cursor = addMonthsISO(cursor, 1)
  while (cursor <= to) {
    dates.push(cursor)
    cursor = addMonthsISO(cursor, 1)
  }
  return dates
}

/** Cria as parcelas que faltam das despesas fixas, de 2 meses atrás a 1 à frente. */
export async function ensureMonthlyExpenses(recurring: RecurringExpense[], existing: Expense[]) {
  const today = todayISO()
  const windowStart = addMonthsISO(today, -2)
  const windowEnd = addMonthsISO(today, 1)
  const existingKeys = new Set(
    existing.filter((e) => e.recurring_id).map((e) => `${e.recurring_id}|${e.date}`),
  )
  let created = 0

  for (const item of recurring.filter((r) => r.status === 'ativo')) {
    const start = item.start_date > windowStart ? item.start_date : windowStart
    const end = item.end_date && item.end_date < windowEnd ? item.end_date : windowEnd
    if (end < start) continue

    for (const date of monthlyDates(start, end, item.day_of_month)) {
      const key = `${item.id}|${date}`
      if (existingKeys.has(key)) continue
      try {
        await api.post('/expenses', {
          recurring_id: item.id,
          vehicle_id: item.vehicle_id || null,
          category: item.category,
          description: item.description || null,
          amount: Number(item.amount || 0),
          date,
          status: 'pendente',
        })
        existingKeys.add(key)
        created += 1
      } catch (err: any) {
        const message = String(err.message || '')
        if (!/duplicate|unique/i.test(message)) throw err
      }
    }
  }

  return created
}

// ---------- somas ----------

export function expensesInPeriod(expenses: Expense[], period: DateRange, vehicleId?: string) {
  return expenses.filter((e) => {
    if (vehicleId && e.vehicle_id !== vehicleId) return false
    return e.date >= period.start && e.date <= period.end
  })
}

export interface CostTotals {
  /** Gastos lançados (seguro, IPVA, multa...). */
  expenses: number
  /** Custo das revisões e manutenções. */
  maintenance: number
  total: number
  /** Quanto desse total já foi efetivamente pago. */
  paid: number
  open: number
}

export function costTotals(expenses: Expense[], maintenances: Maintenance[]): CostTotals {
  const sum = (list: { amount?: number | null; cost?: number | null }[], key: 'amount' | 'cost') =>
    list.reduce((acc, item) => acc + Number(item[key] || 0), 0)

  const expenseTotal = sum(expenses, 'amount')
  const maintenanceTotal = sum(maintenances, 'cost')
  const paid = sum(
    expenses.filter((e) => e.status === 'pago'),
    'amount',
  )

  return {
    expenses: expenseTotal,
    maintenance: maintenanceTotal,
    total: expenseTotal + maintenanceTotal,
    paid: paid + maintenanceTotal,
    open: expenseTotal - paid,
  }
}

export interface CategoryTotal {
  key: string
  label: string
  amount: number
  count: number
}

/**
 * Quebra dos gastos por categoria. As manutenções entram como uma linha
 * própria porque vivem na tabela de manutenções, não na de despesas.
 */
export function costsByCategory(expenses: Expense[], maintenances: Maintenance[]): CategoryTotal[] {
  const map = new Map<string, CategoryTotal>()

  for (const expense of expenses) {
    const key = expense.category || 'outros'
    const current = map.get(key) || { key, label: categoryLabel(key), amount: 0, count: 0 }
    current.amount += Number(expense.amount || 0)
    current.count += 1
    map.set(key, current)
  }

  const maintenanceTotal = maintenances.reduce((acc, m) => acc + Number(m.cost || 0), 0)
  if (maintenances.length > 0) {
    map.set('manutencao', {
      key: 'manutencao',
      label: 'Manutenções e revisões',
      amount: maintenanceTotal,
      count: maintenances.length,
    })
  }

  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

/** Datas e valores de tudo que saiu do caixa, para alimentar o gráfico. */
export function costEntries(expenses: Expense[], maintenances: Maintenance[]) {
  const entries = expenses.map((e) => ({ date: e.date, amount: Number(e.amount || 0) }))
  for (const m of maintenances) {
    const date = m.completed_date || m.scheduled_date
    if (date && m.cost) entries.push({ date, amount: Number(m.cost) })
  }
  return entries
}
