import { ReactNode, useEffect } from 'react'
import { Link } from 'react-router-dom'

export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  back?: { to: string; label: string }
}) {
  return (
    <div className="mb-5">
      {back && (
        <Link to={back.to} className="inline-flex items-center gap-1 text-sm font-medium text-black/50 hover:text-black mb-2">
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight break-words">{title}</h1>
          {subtitle && <p className="text-sm text-black/50 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}
      </div>
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border border-black/10 rounded-xl ${className}`}>{children}</div>
}

export function SectionCard({
  title,
  hint,
  action,
  children,
  padded = true,
}: {
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
  padded?: boolean
}) {
  return (
    <Card>
      <div className="px-4 sm:px-5 py-4 border-b border-black/5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold">{title}</h2>
          {hint && <p className="text-xs text-black/45 mt-0.5">{hint}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={padded ? 'p-4 sm:p-5' : ''}>{children}</div>
    </Card>
  )
}

const buttonStyles = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'bg-black/5 text-ink hover:bg-black/10',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  outline: 'border border-black/15 text-ink hover:bg-black/5',
  success: 'bg-[#25D366] text-white hover:bg-[#1ebe5d]',
}

export type ButtonVariant = keyof typeof buttonStyles

const buttonBase = 'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 min-h-11 px-4 py-3 sm:py-2'

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${buttonBase} ${buttonStyles[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function LinkButton({
  to,
  children,
  variant = 'outline',
  className = '',
}: {
  to: string
  children: ReactNode
  variant?: ButtonVariant
  className?: string
}) {
  return (
    <Link to={to} className={`${buttonBase} ${buttonStyles[variant]} ${className}`}>
      {children}
    </Link>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="block text-xs text-black/45 mt-0.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-black/15 px-3 py-3 sm:py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 min-h-11'

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        } max-h-[92dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-black/10 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-bold text-lg pr-4">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-black/40 hover:text-black text-2xl leading-none h-10 w-10">
            ×
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

const badgeMap: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  pendente: 'bg-amber-100 text-amber-700',
  atrasado: 'bg-red-100 text-red-700',
  pago: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-600',
  em_manutencao: 'bg-amber-100 text-amber-700',
  alugado: 'bg-blue-100 text-blue-700',
  encerrado: 'bg-gray-100 text-gray-600',
  suspenso: 'bg-amber-100 text-amber-700',
  cancelado: 'bg-gray-100 text-gray-600',
  cancelada: 'bg-gray-100 text-gray-600',
  agendada: 'bg-blue-100 text-blue-700',
  concluida: 'bg-green-100 text-green-700',
  ocioso: 'bg-amber-100 text-amber-700',
}

const badgeLabels: Record<string, string> = {
  em_manutencao: 'em manutenção',
  concluida: 'concluída',
  cancelada: 'cancelada',
}

export function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${badgeMap[status] || 'bg-gray-100 text-gray-600'}`}>
      {badgeLabels[status] || status.replace(/_/g, ' ')}
    </span>
  )
}

const toneStyles = {
  neutral: 'text-ink',
  positive: 'text-green-600',
  negative: 'text-red-600',
  warning: 'text-amber-600',
  brand: 'text-brand',
}

export type Tone = keyof typeof toneStyles

export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
  to,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: Tone
  to?: string
}) {
  const body = (
    <>
      <div className={`text-lg sm:text-2xl font-extrabold leading-tight ${toneStyles[tone]}`}>{value}</div>
      <div className="text-xs sm:text-sm text-black/50 mt-1 leading-tight">{label}</div>
      {hint && <div className="text-xs text-black/40 mt-0.5 leading-tight">{hint}</div>}
    </>
  )
  if (to) {
    return (
      <Link to={to} className="block bg-white border border-black/10 rounded-xl p-3 sm:p-4 hover:border-brand/40 transition">
        {body}
      </Link>
    )
  }
  return <div className="bg-white border border-black/10 rounded-xl p-3 sm:p-4">{body}</div>
}

/**
 * Variação em relação ao período anterior. Em `invert`, subir é ruim
 * (é o caso de atrasos e custos).
 */
export function Delta({
  current,
  previous,
  invert = false,
  suffix = 'vs. período anterior',
}: {
  current: number
  previous: number
  invert?: boolean
  suffix?: string
}) {
  if (previous === 0) {
    if (current === 0) return null
    return <span className="text-black/40">sem base de comparação</span>
  }

  const change = ((current - previous) / Math.abs(previous)) * 100
  const rounded = Math.round(change)
  if (rounded === 0) return <span className="text-black/40">estável {suffix}</span>

  const up = rounded > 0
  const good = invert ? !up : up
  return (
    <span className={good ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
      {up ? '▲' : '▼'} {Math.abs(rounded)}% <span className="font-normal text-black/40">{suffix}</span>
    </span>
  )
}

export function InfoList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-black/5">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <dt className="text-sm text-black/50 shrink-0">{item.label}</dt>
          <dd className="text-sm font-medium text-right min-w-0 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Progress({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'positive' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
      <div
        className={`h-full rounded-full ${tone === 'positive' ? 'bg-green-500' : 'bg-brand'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function FilterChips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`shrink-0 rounded-full px-4 py-2.5 min-h-11 text-sm font-semibold transition ${
            value === option.value ? 'bg-ink text-white' : 'bg-white border border-black/10 text-black/60'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative mb-4">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" aria-hidden>
        ⌕
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-8`}
      />
    </div>
  )
}

const alertStyles = {
  danger: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
}

export function AlertBanner({
  level = 'info',
  children,
  action,
}: {
  level?: keyof typeof alertStyles
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between ${alertStyles[level]}`}>
      <div className="min-w-0">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <p className="text-black/40 text-sm">{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="hidden md:block overflow-x-auto">{children}</div>
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 [&>button]:w-full sm:[&>button]:w-auto">
      {children}
    </div>
  )
}

export const cardActionClass = 'inline-flex items-center min-h-11 text-sm font-medium'

export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return <p className="text-sm text-black/40 py-6">{label}</p>
}
