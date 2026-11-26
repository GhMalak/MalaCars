import { FormEvent, useEffect, useState } from 'react'
import { formatDate } from '../lib/format'
import { clampDays, dayPresets, maxDays, type PeriodSelection } from '../lib/period'

const pill = 'shrink-0 rounded-full px-3.5 min-h-10 inline-flex items-center gap-1 text-sm font-semibold transition'
const selectedPill = 'bg-ink text-white'
const plainPill = 'bg-white border border-black/10 text-black/60 hover:border-black/25'

/**
 * Filtro de período enxuto: o padrão é 30 dias e o resto é o dono decidindo
 * quantos dias quer olhar. "Tudo" e a fatia tocada no gráfico completam.
 */
export function PeriodFilter({
  selection,
  onChange,
}: {
  selection: PeriodSelection
  onChange: (selection: PeriodSelection) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(selection.days))

  useEffect(() => {
    setDraft(String(selection.days))
  }, [selection.days])

  const isCustomDays = !selection.all && !selection.custom && !dayPresets.includes(selection.days)

  function pick(days: number) {
    setEditing(false)
    onChange({ days: clampDays(days) })
  }

  function commit() {
    const value = Number(draft)
    if (!draft.trim() || !Number.isFinite(value) || value < 1) {
      setDraft(String(selection.days))
      setEditing(false)
      return
    }
    pick(value)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    commit()
  }

  if (selection.custom) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${pill} ${selectedPill}`}>
          {formatDate(selection.custom.start)} a {formatDate(selection.custom.end)}
        </span>
        <button
          type="button"
          onClick={() => onChange({ days: selection.days })}
          className="text-sm font-semibold text-brand min-h-10 px-1"
        >
          Voltar para {selection.days} dias
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-0.5">
      {dayPresets.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => pick(days)}
          className={`${pill} ${!selection.all && selection.days === days ? selectedPill : plainPill}`}
        >
          {days} dias
        </button>
      ))}

      {editing || isCustomDays ? (
        <form onSubmit={handleSubmit} className={`${pill} ${isCustomDays && !selection.all ? selectedPill : plainPill}`}>
          <input
            type="number"
            min={1}
            max={maxDays}
            inputMode="numeric"
            value={draft}
            autoFocus={editing}
            aria-label="Quantos dias olhar para trás"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            className="w-11 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          dias
        </form>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className={`${pill} ${plainPill}`}>
          Outro
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange({ days: selection.days, all: true })}
        className={`${pill} ${selection.all ? selectedPill : plainPill}`}
      >
        Tudo
      </button>
    </div>
  )
}
