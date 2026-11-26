import { supabase } from './supabase'

const TABLES: Record<string, { table: string; orderBy?: string; ascending?: boolean }> = {
  vehicles: { table: 'vehicles', orderBy: 'plate', ascending: true },
  drivers: { table: 'drivers', orderBy: 'full_name', ascending: true },
  contracts: { table: 'contracts', orderBy: 'created_at', ascending: false },
  'financial-charges': { table: 'financial_charges', orderBy: 'due_date', ascending: true },
  'payment-receipts': { table: 'payment_receipts', orderBy: 'created_at', ascending: false },
  maintenances: { table: 'maintenances', orderBy: 'created_at', ascending: false },
  expenses: { table: 'expenses', orderBy: 'date', ascending: false },
  'recurring-expenses': { table: 'recurring_expenses', orderBy: 'created_at', ascending: false },
}

function parsePath(path: string) {
  const [resource, id] = path.replace(/^\//, '').split('/')
  return { resource, id }
}

function fail(error: { message?: string } | null) {
  if (error) throw new Error(error.message || 'Erro na requisição')
}

export async function getOrganizationId() {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sessão expirada. Entre novamente.')
  const { data, error } = await supabase.from('profiles').select('organization_id').eq('id', auth.user.id).single()
  if (error || !data?.organization_id) {
    throw new Error('Perfil da empresa não encontrado. Crie a conta de novo ou confirme o usuário no Supabase.')
  }
  return data.organization_id as string
}

export const api = {
  async get(path: string) {
    const { resource, id } = parsePath(path)
    const meta = TABLES[resource]
    if (!meta) throw new Error('Rota inválida')

    if (id) {
      const { data, error } = await supabase.from(meta.table).select('*').eq('id', id).single()
      fail(error)
      return data
    }

    let query = supabase.from(meta.table).select('*')
    if (meta.orderBy) query = query.order(meta.orderBy, { ascending: meta.ascending ?? true })
    const { data, error } = await query
    fail(error)
    return data
  },

  async post(path: string, body: unknown) {
    const { resource } = parsePath(path)
    const meta = TABLES[resource]
    if (!meta) throw new Error('Rota inválida')
    const organization_id = await getOrganizationId()
    const { data, error } = await supabase
      .from(meta.table)
      .insert({ ...(body as object), organization_id })
      .select()
      .single()
    fail(error)
    return data
  },

  async put(path: string, body: unknown) {
    const { resource, id } = parsePath(path)
    const meta = TABLES[resource]
    if (!meta || !id) throw new Error('Rota inválida')
    const clean = Object.fromEntries(Object.entries(body as Record<string, unknown>).filter(([, v]) => v !== undefined))
    const { data, error } = await supabase.from(meta.table).update(clean).eq('id', id).select().single()
    fail(error)
    return data
  },

  async patch(path: string, body: unknown) {
    return this.put(path, body)
  },

  async del(path: string) {
    const { resource, id } = parsePath(path)
    const meta = TABLES[resource]
    if (!meta || !id) throw new Error('Rota inválida')
    const { error } = await supabase.from(meta.table).delete().eq('id', id)
    fail(error)
    return null
  },
}
