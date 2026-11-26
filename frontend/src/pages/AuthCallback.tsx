import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function hashParams() {
  const raw = window.location.hash.replace(/^#/, '')
  return new URLSearchParams(raw)
}

function friendlyError(params: URLSearchParams) {
  const code = params.get('error_code') || ''
  const description = (params.get('error_description') || params.get('error') || '')
    .replace(/\+/g, ' ')
  if (code === 'otp_expired' || /invalid or has expired/i.test(description)) {
    return 'Este link de confirmação expirou ou já foi usado. Peça um novo e-mail na tela de cadastro ou tente entrar com e-mail e senha.'
  }
  return description || 'Não foi possível confirmar o e-mail.'
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = hashParams()
    if (params.get('error') || params.get('error_code')) {
      setError(friendlyError(params))
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/app', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    })
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black/[0.02] px-4">
        <div className="w-full max-w-sm text-center bg-white border border-black/10 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-xl font-bold">Link inválido</h1>
          <p className="mt-2 text-sm text-black/60">{error}</p>
          <Link to="/login" className="mt-6 inline-block text-brand font-medium hover:underline text-sm">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center text-black/40 text-sm px-4">
      Confirmando sua conta...
    </div>
  )
}
