import { FormEvent, useState } from 'react'
import { api } from '../lib/api'
import { expenseCategories } from '../lib/expenses'
import type { RecurringExpense, Vehicle } from '../lib/fleet'
import { todayISO } from '../lib/format'
import { Button, Field, FormActions, FormGrid, Modal, inputClass } from './ui'

function toForm(item?: RecurringExpense | null) {
  return {
    category: item?.category || 'seguro',
    description: item?.description || '',
    amount: item ? String(item.amount) : '',
    day_of_month: String(item?.day_of_month ?? 5),
    start_date: item?.start_date || todayISO(),
    end_date: item?.end_date || '',
    vehicle_id: item?.vehicle_id || '',
    status: item?.status || 'ativo',
  }
}

/** Gasto que se repete todo mês, como o seguro. O app lança as parcelas sozinho. */
export function RecurringExpenseFormModal({
  item,
  vehicles,
  onClose,
  onSaved,
}: {
  item?: RecurringExpense | null
  vehicles: Vehicle[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(toForm(item))
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
        day_of_month: Math.min(28, Math.max(1, Number(form.day_of_month) || 5)),
        start_date: form.start_date,
        end_date: form.end_date || null,
        vehicle_id: form.vehicle_id || null,
        status: form.status,
      }
      if (item) {
        await api.put(`/recurring-expenses/${item.id}`, payload)
      } else {
        await api.post('/recurring-expenses', payload)
      }
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar. Rode db/gastos.sql no Supabase.')
      setSaving(false)
    }
  }

  return (
    <Modal title={item ? 'Editar gasto fixo' : 'Novo gasto fixo'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-black/55">
          O app lança a parcela desse gasto todo mês sozinho, do jeito que já faz com as cobranças
          semanais dos contratos.
        </p>

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
          <Field label="Valor por mês">
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
          <Field label="Vence todo dia" hint="De 1 a 28, para caber em qualquer mês">
            <input
              type="number"
              min={1}
              max={28}
              required
              className={inputClass}
              value={form.day_of_month}
              onChange={(e) => set('day_of_month', e.target.value)}
            />
          </Field>
          <Field label="Situação">
            <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
            </select>
          </Field>
        </FormGrid>

        <FormGrid>
          <Field label="Começa em">
            <input
              type="date"
              required
              className={inputClass}
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
            />
          </Field>
          <Field label="Termina em" hint="Deixe vazio se não tem fim">
            <input
              type="date"
              className={inputClass}
              value={form.end_date}
              min={form.start_date}
              onChange={(e) => set('end_date', e.target.value)}
            />
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
            placeholder="Seguro Porto Seguro"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <FormActions>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar gasto fixo'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
