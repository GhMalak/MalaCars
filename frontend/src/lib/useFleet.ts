import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { ensureMonthlyExpenses } from './expenses'
import { loadFleet, type Fleet } from './fleet'
import { listReceipts, type PaymentReceipt } from './receipts'
import { ensureWeeklyCharges } from './weeklyCharges'

export interface FleetState {
  fleet: Fleet | null
  receipts: PaymentReceipt[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/**
 * Carrega a frota inteira de uma vez. Com `ensureCharges`, gera as cobranças
 * semanais e as parcelas de despesa fixa que ainda faltam.
 */
export function useFleet(options: { ensureCharges?: boolean } = {}): FleetState {
  const { ensureCharges = false } = options
  const [fleet, setFleet] = useState<Fleet | null>(null)
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      let data = await loadFleet()
      if (ensureCharges) {
        const created = await ensureWeeklyCharges(data.contracts, data.charges)
        if (created > 0) {
          data = { ...data, charges: await api.get('/financial-charges') }
        }
        if (data.recurring.length > 0) {
          const generated = await ensureMonthlyExpenses(data.recurring, data.expenses)
          if (generated > 0) {
            data = { ...data, expenses: await api.get('/expenses') }
          }
        }
      }
      const files = await listReceipts().catch(() => [])
      setFleet(data)
      setReceipts(files)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [ensureCharges])

  useEffect(() => {
    reload()
  }, [reload])

  return { fleet, receipts, loading, error, reload }
}
