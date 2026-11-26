import { FormEvent, useState } from 'react'
import { api } from '../lib/api'
import { addDaysISO, diffDays, formatDate, money, todayISO } from '../lib/format'
import { paidDateOf, timestampFromDate, type Charge } from '../lib/fleet'
import { Button, Field, FormActions, InfoList, Modal, inputClass } from './ui'

/**
 * Baixa de pagamento com a data real em que o dinheiro entrou.
 * É essa data que alimenta a pontualidade do motorista, por isso ela é
 * editável em vez de assumir sempre "hoje".
 */
export function PaymentModal({
  charge,
  title,
  onClose,
  onSaved,
}: {
  charge: Charge
  title?: string
  onClose: () => void
  onSaved: () => void
}) {
  const today = todayISO()
  const [date, setDate] = useState(paidDateOf(charge) || today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const delay = diffDays(charge.due_date, date)
  const shortcuts = [
    { label: 'Hoje', value: today },
    { label: 'Ontem', value: addDaysISO(today, -1) },
    { label: 'No vencimento', value: charge.due_date },
  ].filter((shortcut, index, list) => list.findIndex((s) => s.value === shortcut.value) === index)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/financial-charges/${charge.id}`, {
        status: 'pago',
        paid_at: timestampFromDate(date),
      })
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Não foi possível registrar o pagamento.')
      setSaving(false)
    }
  }

  return (
    <Modal title={title || 'Registrar recebimento'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InfoList
          items={[
            { label: 'Valor', value: money(charge.amount) },
            { label: 'Vencimento', value: formatDate(charge.due_date) },
          ]}
        />

        <Field label="Dia em que o dinheiro entrou" hint="É o que define se o pagamento foi em dia">
          <input
            type="date"
            required
            className={inputClass}
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.label}
              type="button"
              onClick={() => setDate(shortcut.value)}
              className={`rounded-full px-3 py-2 min-h-11 text-sm font-semibold transition ${
                date === shortcut.value ? 'bg-ink text-white' : 'bg-black/5 text-black/60'
              }`}
            >
              {shortcut.label}
            </button>
          ))}
        </div>

        {charge.due_date > today && (
          <p className="text-sm text-amber-600">
            Esta cobrança só vence em {formatDate(charge.due_date)}. Você está registrando um
            pagamento adiantado.
          </p>
        )}

        {delay <= 0 ? (
          <p className="text-sm font-semibold text-green-700">Pagamento em dia.</p>
        ) : (
          <p className="text-sm font-semibold text-amber-600">
            {delay} {delay === 1 ? 'dia' : 'dias'} de atraso — entra na pontualidade do motorista.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <FormActions>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Confirmar recebimento'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
