import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { logSecurityEvent, resetAccountCache } from './account'
import { mfaPending as checkMfaPending, verifyLoginCode } from './mfa'
import { supabase } from './supabase'

function redirectTo(path: string) {
  return `${window.location.origin}${path}`
}

interface SignUpOptions {
  email: string
  password: string
  organizationName: string
  fullName: string
  inviteCode?: string
}

interface AuthContextValue {
  session: Session | null
  loading: boolean
  /** Senha aceita, mas a conta exige o código do autenticador. */
  mfaPending: boolean
  signUp: (options: SignUpOptions) => Promise<{ session: Session | null }>
  signIn: (email: string, password: string) => Promise<{ mfaRequired: boolean }>
  verifyMfaCode: (code: string) => Promise<void>
  signOut: () => Promise<void>
  signOutEverywhere: () => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  reauthenticate: (password: string) => Promise<void>
  updateEmail: (newEmail: string) => Promise<void>
  refreshMfaState: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaPending, setMfaPending] = useState(false)

  const refreshMfaState = useCallback(async () => {
    const pending = await checkMfaPending().catch(() => false)
    setMfaPending(pending)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await refreshMfaState()
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      if (event === 'SIGNED_OUT') {
        setMfaPending(false)
        resetAccountCache()
        return
      }
      if (newSession) await refreshMfaState()
    })

    return () => listener.subscription.unsubscribe()
  }, [refreshMfaState])

  async function signUp({ email, password, organizationName, fullName, inviteCode }: SignUpOptions) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          organization_name: organizationName,
          full_name: fullName,
          invite_code: inviteCode?.trim().toUpperCase() || null,
        },
        emailRedirectTo: redirectTo('/auth/callback'),
      },
    })
    if (error) throw error
    return { session: data.session }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const pending = await checkMfaPending().catch(() => false)
    setMfaPending(pending)
    if (!pending) await logSecurityEvent('login')
    return { mfaRequired: pending }
  }

  async function verifyMfaCode(code: string) {
    await verifyLoginCode(code)
    setMfaPending(false)
    await logSecurityEvent('login', 'com verificação em duas etapas')
  }

  async function signOut() {
    await logSecurityEvent('logout')
    resetAccountCache()
    await supabase.auth.signOut()
  }

  async function signOutEverywhere() {
    await logSecurityEvent('logout_all')
    resetAccountCache()
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) throw error
  }

  async function resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo('/auth/callback') },
    })
    if (error) throw error
  }

  async function sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo('/redefinir-senha'),
    })
    if (error) throw error
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  /** Confirma que quem está na frente do computador sabe a senha atual. */
  async function reauthenticate(password: string) {
    const email = session?.user?.email
    if (!email) throw new Error('Sessão expirada. Entre novamente.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Senha atual incorreta.')
  }

  async function updateEmail(newEmail: string) {
    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo: redirectTo('/auth/callback') },
    )
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        mfaPending,
        signUp,
        signIn,
        verifyMfaCode,
        signOut,
        signOutEverywhere,
        resendConfirmation,
        sendPasswordReset,
        updatePassword,
        reauthenticate,
        updateEmail,
        refreshMfaState,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
