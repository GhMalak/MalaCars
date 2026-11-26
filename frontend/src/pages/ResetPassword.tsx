import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordStrength } from '../components/PasswordStrength'
import { logSecurityEvent } from '../lib/account'
import { useAuth } from '../lib/AuthContext'
import { scorePassword } from '../lib/passwords'
import { supabase } from '../lib/supabase'

function hashError() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const code = params.get('error_code') || ''
  const description = (params.get('error_description') || params.get('error') || '').replace(/\+/g, ' ')
  if (!code && !description) return null
  if (code === 'otp_expired' || /expired/i.test(description)) {
    return 'Este link expirou ou já foi usado. Peça um novo link de recuperação.'
  }
  return description || 'Não foi possível validar o link.'
}

export default function ResetPassword() {
  const { updatePassword, mfaPending } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const problem = hashError()
    if (problem) {
      setLinkError(problem)
      setStatus('invalid')
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    let settled = false
    const finish = (hasSession: boolean) => {
      if (settled) return
      settled = true
      setStatus(hasSession ? 'ready' : 'invalid')
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(true)
    })

    // O SDK precisa de um instante para trocar o token da URL por uma sessão.
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      finish(Boolean(data.session))
    }, 1200)

    return () => {
      clearTimeout(timer)
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('As duas senhas não são iguais.')
      return
    }
    if (!scorePassword(password).acceptable) {
      setError('Escolha uma senha mais forte: mínimo de 8 caracteres, com letras e números.')
      return
    }

    setSaving(true)
    try {
      await updatePassword(password)
      await logSecurityEvent('password_reset_completed')
      setDone(true)
      // Com duas etapas ativas, ainda falta o código do autenticador.
      setTimeout(() => navigate(mfaPending ? '/login' : '/app', { replace: true }), 1500)
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar a nova senha.')
    } finally {
      setSaving(false)
    }
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
          {status === 'checking' && <p className="text-sm text-black/50">Validando o link de recuperação...</p>}

          {status === 'invalid' && (
            <>
              <h1 className="text-xl font-bold">Link inválido</h1>
              <p className="mt-2 text-sm text-black/60">
                {linkError || 'Abra o link mais recente que enviamos por e-mail. Cada link só funciona uma vez.'}
              </p>
              <Link
                to="/recuperar-senha"
                className="mt-5 inline-block rounded-lg bg-brand text-white font-semibold px-4 py-3 min-h-11 hover:bg-brand-dark transition"
              >
                Pedir novo link
              </Link>
            </>
          )}

          {status === 'ready' && done && (
            <>
              <h1 className="text-xl font-bold">Senha atualizada</h1>
              <p className="mt-2 text-sm text-black/60">
                {mfaPending
                  ? 'Pronto. Agora confirme o código do seu aplicativo autenticador para entrar.'
                  : 'Pronto. Estamos levando você para o painel. Use a senha nova nos próximos acessos.'}
              </p>
            </>
          )}

          {status === 'ready' && !done && (
            <>
              <h1 className="text-xl font-bold">Criar nova senha</h1>
              <p className="text-sm text-black/50 mt-1">
                Escolha uma senha que você não use em outros sites. Todas as outras sessões continuam válidas.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium">Nova senha</label>
                  <input
                    type="password"
                    required
                    autoFocus
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 min-h-11"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <PasswordStrength password={password} />
                </div>
                <div>
                  <label className="text-sm font-medium">Repita a nova senha</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 min-h-11"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-brand text-white font-semibold py-3 min-h-11 hover:bg-brand-dark transition disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
