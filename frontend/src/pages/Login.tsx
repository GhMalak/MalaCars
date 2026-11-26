import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const fieldClass =
  'mt-1 w-full rounded-lg border border-black/15 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 min-h-11'

export default function Login() {
  const { signIn, verifyMfaCode, signOut, mfaPending } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'password' | 'mfa'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Se a pessoa recarregou a página entre a senha e o código, retomamos ali.
  useEffect(() => {
    if (mfaPending) setStep('mfa')
  }, [mfaPending])

  async function handlePassword(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { mfaRequired } = await signIn(email, password)
      if (mfaRequired) {
        setStep('mfa')
        return
      }
      navigate('/app')
    } catch (err: any) {
      const message = String(err?.message || '')
      if (/invalid login credentials/i.test(message)) {
        setError('E-mail ou senha incorretos.')
      } else if (/email not confirmed/i.test(message)) {
        setError('Confirme seu e-mail antes de entrar. Verifique a caixa de entrada.')
      } else {
        setError(message || 'Não foi possível entrar. Verifique seus dados.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyMfaCode(code)
      navigate('/app')
    } catch {
      setError('Código incorreto ou expirado. Confira o aplicativo autenticador e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelMfa() {
    await signOut()
    setStep('password')
    setCode('')
    setPassword('')
    setError(null)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-black/[0.02] px-4 py-8">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <img src="/athena-icon.svg" alt="Athena Frotas" className="h-9 w-9" />
          <span className="font-extrabold text-xl">
            ATHENA <span className="text-brand">FROTAS</span>
          </span>
        </Link>

        <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-8 shadow-sm">
          {step === 'password' ? (
            <>
              <h1 className="text-xl font-bold">Entrar</h1>
              <p className="text-sm text-black/50 mt-1">Acesse o painel da sua frota.</p>

              <form onSubmit={handlePassword} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="voce@empresa.com"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium">Senha</label>
                    <Link to="/recuperar-senha" className="text-xs font-semibold text-brand hover:underline">
                      Esqueci minha senha
                    </Link>
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={fieldClass}
                    placeholder="••••••••"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-brand text-white font-semibold py-3 min-h-11 hover:bg-brand-dark transition disabled:opacity-60"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-black/60">
                Ainda não tem conta?{' '}
                <Link to="/cadastro" className="text-brand font-medium hover:underline">
                  Criar conta
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">Confirme que é você</h1>
              <p className="text-sm text-black/50 mt-1">
                Digite o código de 6 dígitos do seu aplicativo autenticador.
              </p>

              <form onSubmit={handleCode} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium">Código</label>
                  <input
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className={`${fieldClass} text-center text-xl tracking-[0.5em] font-mono`}
                    placeholder="000000"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full rounded-lg bg-brand text-white font-semibold py-3 min-h-11 hover:bg-brand-dark transition disabled:opacity-60"
                >
                  {loading ? 'Verificando...' : 'Confirmar'}
                </button>
              </form>

              <button
                type="button"
                onClick={handleCancelMfa}
                className="mt-6 w-full text-center text-sm text-black/60 hover:text-black min-h-11"
              >
                Entrar com outra conta
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
