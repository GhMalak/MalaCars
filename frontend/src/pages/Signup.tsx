import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordStrength } from '../components/PasswordStrength'
import { useAuth } from '../lib/AuthContext'
import { scorePassword } from '../lib/passwords'

const fieldClass =
  'mt-1 w-full rounded-lg border border-black/15 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 min-h-11'

export default function Signup() {
  const { signUp, resendConfirmation } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'empresa' | 'convite'>('empresa')
  const [organizationName, setOrganizationName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!scorePassword(password).acceptable) {
      setError('Escolha uma senha mais forte: mínimo de 8 caracteres, com letras e números.')
      return
    }

    setLoading(true)
    try {
      const { session } = await signUp({
        email,
        password,
        organizationName: mode === 'empresa' ? organizationName : '',
        fullName,
        inviteCode: mode === 'convite' ? inviteCode : undefined,
      })
      if (session) {
        navigate('/app', { replace: true })
        return
      }
      setDone(true)
    } catch (err: any) {
      const message = String(err?.message || '')
      if (/already registered|already exists/i.test(message)) {
        setError('Já existe uma conta com esse e-mail. Tente entrar ou recuperar a senha.')
      } else {
        setError(message || 'Não foi possível criar sua conta.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black/[0.02] px-4">
        <div className="w-full max-w-sm text-center bg-white border border-black/10 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-xl font-bold">Quase lá!</h1>
          <p className="mt-2 text-sm text-black/60">
            Enviamos um e-mail de confirmação para <strong>{email}</strong>. Use o link mais recente e ignore e-mails
            antigos — o link anterior deixa de valer.
          </p>
          <button
            type="button"
            disabled={resending}
            onClick={async () => {
              setResending(true)
              setError(null)
              try {
                await resendConfirmation(email)
                setResent(true)
              } catch (err: any) {
                setError(err.message || 'Não foi possível reenviar o e-mail.')
              } finally {
                setResending(false)
              }
            }}
            className="mt-5 text-sm text-brand font-medium hover:underline disabled:opacity-60"
          >
            {resending ? 'Reenviando...' : resent ? 'E-mail reenviado' : 'Reenviar e-mail'}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <Link to="/login" className="mt-6 block text-brand font-medium hover:underline text-sm">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-black/[0.02] px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <img src="/athena-icon.svg" alt="Athena Frotas" className="h-9 w-9" />
          <span className="font-extrabold text-xl">
            ATHENA <span className="text-brand">FROTAS</span>
          </span>
        </Link>

        <div className="bg-white border border-black/10 rounded-2xl p-5 sm:p-8 shadow-sm">
          <h1 className="text-xl font-bold">Criar conta</h1>
          <p className="text-sm text-black/50 mt-1">Comece a organizar sua frota agora.</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('empresa')}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition min-h-11 ${
                mode === 'empresa' ? 'bg-ink text-white' : 'bg-black/5 text-black/60'
              }`}
            >
              Minha frota
            </button>
            <button
              type="button"
              onClick={() => setMode('convite')}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition min-h-11 ${
                mode === 'convite' ? 'bg-ink text-white' : 'bg-black/5 text-black/60'
              }`}
            >
              Tenho convite
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === 'empresa' ? (
              <div>
                <label className="text-sm font-medium">Nome da empresa / frota</label>
                <input
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className={fieldClass}
                  placeholder="Ex: Transportes Calasan"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">Código de convite</label>
                <input
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  className={`${fieldClass} font-mono tracking-widest uppercase`}
                  placeholder="ABCD1234"
                  maxLength={12}
                />
                <p className="mt-1 text-xs text-black/50">
                  O administrador da frota encontra esse código em Minha conta → Equipe.
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Seu nome</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={fieldClass}
                placeholder="Seu nome completo"
              />
            </div>
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
              <label className="text-sm font-medium">Senha</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                placeholder="Mínimo 8 caracteres"
              />
              <PasswordStrength password={password} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand text-white font-semibold py-3 min-h-11 hover:bg-brand-dark transition disabled:opacity-60"
            >
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-black/60">
            Já tem conta?{' '}
            <Link to="/login" className="text-brand font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
