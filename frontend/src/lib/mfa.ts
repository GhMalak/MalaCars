import { supabase } from './supabase'

export interface TotpFactor {
  id: string
  friendlyName?: string
  status: string
  createdAt: string
}

export interface TotpEnrollment {
  factorId: string
  qrCode: string
  secret: string
  uri: string
}

/** Fatores TOTP já confirmados na conta. */
export async function listTotpFactors(): Promise<TotpFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw new Error(error.message)
  return (data?.totp || []).map((factor) => ({
    id: factor.id,
    friendlyName: factor.friendly_name ?? undefined,
    status: factor.status,
    createdAt: factor.created_at,
  }))
}

/** Remove fatores que ficaram pela metade (usuário desistiu no meio do processo). */
export async function clearUnverifiedFactors() {
  const { data } = await supabase.auth.mfa.listFactors()
  const pending = (data?.all || []).filter((factor) => factor.status !== 'verified')
  for (const factor of pending) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id })
  }
}

export async function enrollTotp(friendlyName = 'Athena Frotas'): Promise<TotpEnrollment> {
  await clearUnverifiedFactors()
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `${friendlyName} ${new Date().toISOString().slice(0, 10)}`,
  })
  if (error) throw new Error(error.message)
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  }
}

export async function confirmTotp(factorId: string, code: string) {
  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error) throw new Error(challenge.error.message)
  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code: code.replace(/\s/g, ''),
  })
  if (verify.error) throw new Error(verify.error.message)
}

export async function disableTotp(factorId: string) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw new Error(error.message)
}

/**
 * A sessão existe, mas ainda falta o segundo fator?
 * Serve para bloquear o painel entre a senha e o código.
 */
export async function mfaPending() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return false
  return data.nextLevel === 'aal2' && data.currentLevel !== 'aal2'
}

/** Valida o código de 6 dígitos no login. */
export async function verifyLoginCode(code: string) {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw new Error(error.message)
  const factor = (data?.totp || []).find((f) => f.status === 'verified')
  if (!factor) throw new Error('Nenhum aplicativo autenticador ativo nesta conta.')
  await confirmTotp(factor.id, code)
}
