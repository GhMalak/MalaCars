import { scorePassword } from '../lib/passwords'

const barColors = ['bg-black/10', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-600']
const textColors = ['text-black/40', 'text-red-600', 'text-amber-600', 'text-lime-700', 'text-green-700']

export function PasswordStrength({ password, showChecklist = true }: { password: string; showChecklist?: boolean }) {
  if (!password) return null
  const result = scorePassword(password)

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full ${step <= result.score ? barColors[result.score] : 'bg-black/10'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-semibold mt-1.5 ${textColors[result.score]}`}>Senha {result.label.toLowerCase()}</p>
      {showChecklist && (
        <ul className="mt-1.5 space-y-0.5">
          {result.checks.map((check) => (
            <li key={check.label} className={`text-xs flex items-center gap-1.5 ${check.passed ? 'text-green-700' : 'text-black/45'}`}>
              <span aria-hidden>{check.passed ? '✓' : '○'}</span>
              {check.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
