import { money, moneyShort } from '../lib/format'
import type { SeriesPoint } from '../lib/fleet'

/**
 * Gráfico de barras em CSS puro (sem biblioteca). Cada fatia do período tem a
 * coluna das entradas (verde do que entrou, amarelo do que falta) e, quando
 * existe gasto, a coluna vermelha do que saiu ao lado.
 * Tocar numa coluna filtra o painel inteiro por aquela fatia.
 */
export function BarChart({
  points,
  selected,
  onSelect,
}: {
  points: SeriesPoint[]
  selected?: string
  onSelect?: (point: SeriesPoint) => void
}) {
  if (points.length === 0) {
    return <p className="text-sm text-black/40">Sem movimento neste período para montar o gráfico.</p>
  }

  const showExpense = points.some((point) => point.expense > 0)
  const max = Math.max(...points.map((point) => Math.max(point.total, point.expense)), 1)

  return (
    <div>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div
          className="flex items-stretch gap-1.5"
          style={{ minWidth: `${points.length * (showExpense ? 54 : 40)}px` }}
        >
          {points.map((point) => {
            const receivedShare = point.total > 0 ? (point.received / point.total) * 100 : 0
            const isSelected = selected === point.start
            const title = showExpense
              ? `${point.label}: entrou ${money(point.received)}, saiu ${money(point.expense)} · líquido ${money(point.net)}`
              : `${point.label}: ${money(point.received)} recebido de ${money(point.total)}`

            return (
              <button
                key={point.start}
                type="button"
                onClick={() => onSelect?.(point)}
                disabled={!onSelect}
                title={title}
                className={`flex-1 ${showExpense ? 'min-w-[3.25rem]' : 'min-w-9'} flex flex-col justify-end h-40 rounded-lg px-0.5 pt-1 transition ${
                  isSelected ? 'bg-brand/10' : onSelect ? 'hover:bg-black/[0.03]' : ''
                }`}
              >
                <span className="text-[10px] font-semibold text-black/45 leading-none mb-1 truncate">
                  {point.total > 0 || point.expense > 0 ? moneyShort(point.total) : ''}
                </span>

                <span className="flex-1 flex items-end justify-center gap-0.5 w-full">
                  <span
                    className="flex-1 rounded-t-md bg-amber-300 relative overflow-hidden min-h-[2px]"
                    style={{ height: `${Math.max((point.total / max) * 100, point.total > 0 ? 3 : 0)}%` }}
                  >
                    <span
                      className="absolute inset-x-0 bottom-0 bg-green-500"
                      style={{ height: `${receivedShare}%` }}
                    />
                  </span>
                  {showExpense && (
                    <span
                      className="flex-1 rounded-t-md bg-red-400 min-h-[2px]"
                      style={{ height: `${Math.max((point.expense / max) * 100, point.expense > 0 ? 3 : 0)}%` }}
                    />
                  )}
                </span>

                <span
                  className={`text-[10px] mt-1.5 leading-none truncate ${
                    isSelected ? 'text-brand font-bold' : 'text-black/45'
                  }`}
                >
                  {point.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-black/50">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-500" aria-hidden /> Recebido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-300" aria-hidden /> Em aberto
        </span>
        {showExpense && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-400" aria-hidden /> Gasto
          </span>
        )}
        {onSelect && <span className="ml-auto hidden sm:inline">Toque numa coluna para filtrar</span>}
      </div>
    </div>
  )
}
