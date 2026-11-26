import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, mfaPending } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-black/40 text-sm px-4">Carregando...</div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Senha correta, mas o segundo fator ainda não foi confirmado.
  if (mfaPending) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
