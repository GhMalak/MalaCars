import { ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, money } from '../lib/format'
import { chargeStatus, paymentDelay, type Charge } from '../lib/fleet'
import { deleteReceipt, openReceipt, uploadReceipt, type PaymentReceipt } from '../lib/receipts'
import { PaymentModal } from './PaymentModal'
import { Badge, EmptyState, cardActionClass } from './ui'

export interface ChargeDescription {
  title: string
  to?: string
}

export function ChargeList({
  charges,
  receipts,
  describe,
  onChanged,
  allowDelete = true,
  emptyMessage = 'Nenhuma cobrança neste período.',
  emptyAction,
}: {
  charges: Charge[]
  receipts: PaymentReceipt[]
  describe?: (charge: Charge) => ChargeDescription
  onChanged: () => void
  allowDelete?: boolean
  emptyMessage?: string
  emptyAction?: ReactNode
}) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState<Charge | null>(null)

  async function unmarkPaid(charge: Charge) {
    setBusyId(charge.id)
    setError(null)
    try {
      await api.patch(`/financial-charges/${charge.id}`, { status: 'pendente', paid_at: null })
      onChanged()
    } catch (err: any) {
      setError(err.message || 'Não foi possível atualizar a cobrança.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleUpload(chargeId: string, file?: File) {
    if (!file) return
    setBusyId(chargeId)
    setError(null)
    try {
      await uploadReceipt(chargeId, file)
      onChanged()
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar comprovante. Rode db/financeiro.sql no Supabase.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(charge: Charge) {
    if (!confirm('Excluir esta cobrança?')) return
    setBusyId(charge.id)
    try {
      await api.del(`/financial-charges/${charge.id}`)
      onChanged()
    } catch (err: any) {
      setError(err.message || 'Não foi possível excluir.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteReceipt(receipt: PaymentReceipt) {
    if (!confirm(`Excluir o comprovante ${receipt.file_name}?`)) return
    try {
      await deleteReceipt(receipt)
      onChanged()
    } catch (err: any) {
      setError(err.message || 'Não foi possível excluir o comprovante.')
    }
  }

  if (charges.length === 0) {
    return <EmptyState message={emptyMessage} action={emptyAction} />
  }

  return (
    <div>
      {error && <p className="px-4 pt-3 text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-black/5">
        {charges.map((charge) => {
          const status = chargeStatus(charge)
          const files = receipts.filter((r) => r.charge_id === charge.id)
          const info = describe?.(charge)
          const busy = busyId === charge.id
          const paid = charge.status === 'pago'
          const delay = paymentDelay(charge)
          return (
            <li key={charge.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer min-h-11">
                  <input
                    type="checkbox"
                    checked={paid}
                    disabled={busy}
                    onChange={() => (paid ? unmarkPaid(charge) : setPaying(charge))}
                    className="h-5 w-5 accent-brand"
                  />
                  <span className="text-sm font-semibold">Recebido</span>
                </label>
                <Badge status={status} />
              </div>

              {info && (
                <div className="font-extrabold mt-1 break-words">
                  {info.to ? (
                    <Link to={info.to} className="hover:text-brand">
                      {info.title}
                    </Link>
                  ) : (
                    info.title
                  )}
                </div>
              )}

              <div className="text-sm text-black/55 mt-1">
                {money(charge.amount)} · vencimento {formatDate(charge.due_date)}
                {charge.paid_at && ` · recebido em ${formatDate(charge.paid_at)}`}
              </div>

              {paid && delay !== null && (
                <div className={`text-xs font-semibold mt-1 ${delay === 0 ? 'text-green-700' : 'text-amber-600'}`}>
                  {delay === 0 ? 'Pago em dia' : `Pago com ${delay} ${delay === 1 ? 'dia' : 'dias'} de atraso`}
                </div>
              )}

              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map((file) => (
                    <li key={file.id} className="flex items-center justify-between gap-3 text-sm">
                      <button onClick={() => openReceipt(file.file_path)} className="text-brand font-medium truncate text-left">
                        {file.file_name}
                      </button>
                      <button onClick={() => handleDeleteReceipt(file)} className="text-black/35 shrink-0" aria-label="Excluir comprovante">
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {paid && (
                  <button onClick={() => setPaying(charge)} className={`${cardActionClass} text-brand`}>
                    Alterar data
                  </button>
                )}
                <label className={`${cardActionClass} text-brand cursor-pointer`}>
                  {busy ? 'Enviando...' : files.length ? 'Anexar outro comprovante' : 'Anexar comprovante'}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => {
                      handleUpload(charge.id, e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </label>
                {allowDelete && (
                  <button onClick={() => handleDelete(charge)} className={`${cardActionClass} text-red-600`}>
                    Excluir
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {paying && (
        <PaymentModal
          charge={paying}
          title={paying.status === 'pago' ? 'Alterar data do recebimento' : 'Registrar recebimento'}
          onClose={() => setPaying(null)}
          onSaved={() => {
            setPaying(null)
            onChanged()
          }}
        />
      )}
    </div>
  )
}
