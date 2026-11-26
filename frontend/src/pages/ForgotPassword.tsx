import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await sendPasswordReset(email)
      setSent(true)
    } catch (err: any) {
      const message = String(err?.message || '')
      // Só mostramos o erro quando ele é útil (limite de envio).
      // Nos outros casos respondemos igual, para não revelar se o e-mail existe.
      if (/rate limit|too many/i.test(message)) {
        setError('Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.')
      } else {
        setSent(true)
      }
    } finally {
      setLoading(false)
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
          {sent ? (
            <>
              <h1 className="text-xl font-bold">Verifique seu e-mail</h1>
              <p className="mt-2 text-sm text-black/60">
                Se existir uma conta com <strong>{email}</strong>, enviamos um link para criar uma nova senha. O link vale
                por 1 hora e só pode ser usado uma vez.
              </p>
              <p className="mt-3 text-sm text-black/50">
                Não chegou? Confira a caixa de spam e confirme se digitou o mesmo e-mail do cadastro.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-5 text-sm text-brand font-medium hover:underline"
              >
                Tentar outro e-mail
              </button>
              <Link to="/login" className="mt-6 block text-center text-sm text-black/60 hover:text-black">
                Voltar para o login
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">Esqueci minha senha</h1>
              <p className="text-sm text-black/50 mt-1">
                Informe o e-mail da sua conta. Vamos enviar um link para você criar uma senha nova.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium">E-mail da conta</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 min-h-11"
                    placeholder="voce@empresa.com"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-brand text-white font-semibold py-3 min-h-11 hover:bg-brand-dark transition disabled:opacity-60"
                >
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>

              <Link to="/login" className="mt-6 block text-center text-sm text-black/60 hover:text-black">
                Voltar para o login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
