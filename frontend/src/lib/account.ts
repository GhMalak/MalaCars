import { removeImage, uploadImage } from './photos'
import { supabase } from './supabase'

export type Role = 'admin' | 'operador'

export interface Profile {
  id: string
  organization_id: string
  full_name: string | null
  role: Role
  phone?: string | null
  avatar_path?: string | null
  preferences?: Record<string, unknown> | null
  last_seen_at?: string | null
  created_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  invite_code?: string | null
  created_at: string
}

export interface Account {
  profile: Profile
  organization: Organization
  team: Profile[]
}

export interface Preferences {
  /** Antecedência, em dias, para avisar sobre CNH e documentos. */
  alertDays: number
  /** Dia da semana sugerido ao criar um contrato. */
  defaultDueWeekday: number
}

export const defaultPreferences: Preferences = { alertDays: 30, defaultDueWeekday: 1 }

export function readPreferences(profile?: Profile | null): Preferences {
  const raw = (profile?.preferences || {}) as Record<string, unknown>
  const alertDays = Number(raw.alertDays)
  const defaultDueWeekday = Number(raw.defaultDueWeekday)
  return {
    alertDays: Number.isFinite(alertDays) && alertDays > 0 ? alertDays : defaultPreferences.alertDays,
    defaultDueWeekday:
      Number.isFinite(defaultDueWeekday) && defaultDueWeekday >= 0 && defaultDueWeekday <= 6
        ? defaultDueWeekday
        : defaultPreferences.defaultDueWeekday,
  }
}

export async function currentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Sessão expirada. Entre novamente.')
  return data.user
}

export async function loadAccount(): Promise<Account> {
  const user = await currentUser()

  const profileRes = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profileRes.error || !profileRes.data) {
    throw new Error('Perfil não encontrado. Rode db/fix_signup.sql no Supabase ou crie a conta novamente.')
  }
  const profile = profileRes.data as Profile

  const [orgRes, teamRes] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', profile.organization_id).single(),
    supabase.from('profiles').select('*').eq('organization_id', profile.organization_id).order('created_at'),
  ])
  if (orgRes.error || !orgRes.data) throw new Error('Empresa não encontrada.')

  return {
    profile,
    organization: orgRes.data as Organization,
    team: (teamRes.data || []) as Profile[],
  }
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function updateOrganization(organizationId: string, patch: Partial<Organization>) {
  const { error } = await supabase.from('organizations').update(patch).eq('id', organizationId)
  if (error) throw new Error(error.message)
}

export async function updateTeamRole(userId: string, role: Role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function rotateInviteCode() {
  const { data, error } = await supabase.rpc('rotate_invite_code')
  if (error) throw new Error(error.message)
  return data as string
}

// ---------- avatar ----------

export async function uploadAvatar(profile: Profile, file: File) {
  const path = await uploadImage(file, '', profile.id)

  // Trocar jpg por png deixaria o arquivo antigo órfão no bucket.
  if (profile.avatar_path && profile.avatar_path !== path) {
    await removeImage(profile.avatar_path)
  }

  await updateProfile(profile.id, { avatar_path: path })
  resetAccountCache()
  return path
}

export async function removeAvatar(profile: Profile) {
  await removeImage(profile.avatar_path)
  await updateProfile(profile.id, { avatar_path: null })
  resetAccountCache()
}

// ---------- eventos de segurança ----------

export interface SecurityEvent {
  id: string
  user_id: string
  event: string
  detail?: string | null
  user_agent?: string | null
  created_at: string
}

export const securityEventLabels: Record<string, string> = {
  login: 'Entrou na conta',
  logout: 'Saiu da conta',
  logout_all: 'Encerrou todas as sessões',
  password_changed: 'Senha alterada',
  password_reset_requested: 'Recuperação de senha solicitada',
  password_reset_completed: 'Senha redefinida por e-mail',
  email_change_requested: 'Troca de e-mail solicitada',
  profile_updated: 'Perfil atualizado',
  organization_updated: 'Dados da empresa atualizados',
  invite_rotated: 'Novo código de convite gerado',
  mfa_enabled: 'Verificação em duas etapas ativada',
  mfa_disabled: 'Verificação em duas etapas desativada',
  role_changed: 'Permissão de usuário alterada',
}

/** Registro best-effort: uma falha aqui nunca deve travar a ação do usuário. */
export async function logSecurityEvent(event: string, detail?: string) {
  try {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', data.user.id)
      .single()

    await supabase.from('security_events').insert({
      organization_id: profile?.organization_id ?? null,
      user_id: data.user.id,
      event,
      detail: detail || null,
      user_agent: navigator.userAgent.slice(0, 300),
    })
  } catch {
    // tabela ainda não migrada ou sem sessão: ignoramos de propósito
  }
}

export async function listSecurityEvents(limit = 20): Promise<SecurityEvent[]> {
  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data || []) as SecurityEvent[]
}

// ---------- perfil em cache, usado fora da tela de conta ----------

let profileCache: Promise<Profile | null> | null = null

/** Perfil do usuário logado, buscado uma vez por sessão. */
export function loadMyProfile(): Promise<Profile | null> {
  if (!profileCache) {
    profileCache = (async () => {
      try {
        const user = await currentUser()
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        return (data as Profile) || null
      } catch {
        return null
      }
    })()
  }
  return profileCache
}

export async function loadPreferences(): Promise<Preferences> {
  return readPreferences(await loadMyProfile())
}

export function resetAccountCache() {
  profileCache = null
}
