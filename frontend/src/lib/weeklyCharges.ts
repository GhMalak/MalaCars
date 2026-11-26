import { api } from './api'
import type { Charge, Contract } from './fleet'

function iso(d: Date) {
  const copy = new Date(d)
  copy.setHours(12, 0, 0, 0)
  return copy.toISOString().slice(0, 10)
}

function parseISO(value: string) {
  const [y, m, day] = value.split('-').map(Number)
  return new Date(y, m - 1, day, 12)
}

function addDays(value: string, days: number) {
  const d = parseISO(value)
  d.setDate(d.getDate() + days)
  return iso(d)
}

export function weeklyDueDates(from: string, to: string, weekday: number) {
  const dates: string[] = []
  const cursor = parseISO(from)
  const end = parseISO(to)
  const day = ((weekday % 7) + 7) % 7
  while (cursor.getDay() !== day) {
    cursor.setDate(cursor.getDate() + 1)
  }
  while (cursor <= end) {
    dates.push(iso(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return dates
}

/** Cria as cobranças semanais que faltam, de 8 semanas atrás até 4 à frente. */
export async function ensureWeeklyCharges(contracts: Contract[], existing: Charge[]) {
  const today = iso(new Date())
  const windowStart = addDays(today, -56)
  const windowEnd = addDays(today, 28)
  const existingKeys = new Set(existing.map((c) => `${c.contract_id}|${c.due_date}`))
  let created = 0

  for (const contract of contracts.filter((c) => c.status === 'ativo')) {
    const start = contract.start_date > windowStart ? contract.start_date : windowStart
    const end = contract.end_date && contract.end_date < windowEnd ? contract.end_date : windowEnd
    if (end < start) continue

    for (const due of weeklyDueDates(start, end, contract.due_weekday ?? 1)) {
      const key = `${contract.id}|${due}`
      if (existingKeys.has(key)) continue
      try {
        await api.post('/financial-charges', {
          contract_id: contract.id,
          reference_date: due,
          due_date: due,
          amount: Number(contract.weekly_value || 0),
          status: due < today ? 'atrasado' : 'pendente',
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
