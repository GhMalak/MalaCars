export interface PasswordCheck {
  label: string
  passed: boolean
}

export interface PasswordScore {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  checks: PasswordCheck[]
  acceptable: boolean
}

const common = [
  '123456',
  '12345678',
  'senha',
  'password',
  'qwerty',
  'abc123',
  '111111',
  'admin',
  'brasil',
  '123456789',
]

/** Avaliação simples e local: nada é enviado para fora do navegador. */
export function scorePassword(password: string): PasswordScore {
  const lower = password.toLowerCase()
  const checks: PasswordCheck[] = [
    { label: 'Pelo menos 8 caracteres', passed: password.length >= 8 },
    { label: 'Letras maiúsculas e minúsculas', passed: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Pelo menos um número', passed: /\d/.test(password) },
    { label: 'Um símbolo (!, @, #...)', passed: /[^A-Za-z0-9]/.test(password) },
    { label: 'Não é uma senha óbvia', passed: password.length > 0 && !common.some((c) => lower.includes(c)) },
  ]

  const passed = checks.filter((c) => c.passed).length
  const score = (password.length === 0 ? 0 : Math.max(1, Math.min(4, passed - 1))) as PasswordScore['score']
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte']

  return {
    score,
    label: labels[score],
    checks,
    acceptable: password.length >= 8 && passed >= 3,
  }
}
