import { FormEvent, useState } from 'react'
import { api } from '../lib/api'
import { expenseCategories } from '../lib/expenses'
import type { Expense, Vehicle } from '../lib/fleet'
import { todayISO } from '../lib/format'
import { Button, Field, FormActions, FormGrid, Modal, inputClass } from './ui'

function toForm(expense?: Expense | null) {
  return {
    category: expense?.category || 'seguro',
    description: expense?.description || '',
    amount: expense ? String(expense.amount) : '',
    date: expense?.date || todayISO(),
    vehicle_id: expense?.vehicle_id || '',
    status: expense?.status || 'pendente',
    notes: expense?.notes || '',
  }
}

export function ExpenseFormModal({
  expense,
  vehicles,
  onClose,
  onSaved,
}: {
  expense?: Expense | null
  vehicles: Vehicle[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(toForm(expense))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        category: form.category,
        description: form.description.trim() || null,
        amount: Number(form.amount.replace(',', '.')) || 0,
        date: form.date,
        vehicle_id: form.vehicle_id || null,
        status: form.status,
        paid_at: form.status === 'pago' ? expense?.paid_at || new Date().toISOString() : null,
        notes: form.notes.trim() || null,
      }
      if (expense) {
        await api.put(`/expenses/${expense.id}`, payload)
      } else {
        await api.post('/expenses', payload)
      }
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar. Rode db/gastos.sql no Supabase.')
      setSaving(false)
    }
  }

  return (
    <Modal title={expense ? 'Editar gasto' : 'Novo gasto'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormGrid>
          <Field label="Tipo de gasto">
            <select className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
              {expenseCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valor">
            <input
              required
              inputMode="decimal"
              className={inputClass}
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="250,00"
            />
          </Field>
        </FormGrid>

        <FormGrid>
          <Field label="Data">
            <input
              type="date"
              required
              className={inputClass}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Field>
          <Field label="Situação">
            <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="pendente">A pagar</option>
              <option value="pago">Já paguei</option>
            </select>
          </Field>
        </FormGrid>

        <Field label="Veículo" hint="Deixe em branco para um gasto da frota inteira">
          <select className={inputClass} value={form.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)}>
            <option value="">Toda a frota</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plate}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Descrição">
          <input
            className={inputClass}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Seguro Porto — parcela de setembro"
          />
        </Field>

        <Field label="Observações">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <FormActions>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar gasto'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
