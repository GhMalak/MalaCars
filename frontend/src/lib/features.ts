import { supabase } from './supabase'

/**
 * O app funciona antes e depois das migrações em db/.
 * Aqui detectamos uma única vez o que o banco já suporta, para não
 * tentar salvar colunas ou tabelas que ainda não existem.
 */
export interface Features {
  /** db/documentos.sql → colunas de documento do veículo */
  vehicleDocuments: boolean
  /** db/documentos.sql → dados extras do motorista */
  driverDetails: boolean
  /** db/documentos.sql → tabela documents + bucket documentos */
  documentFiles: boolean
  /** db/conta.sql → avatar, telefone e preferências no perfil */
  accountProfile: boolean
  /** db/conta.sql → código de convite da empresa */
  teamInvites: boolean
  /** db/conta.sql → tabela security_events */
  securityLog: boolean
  /** db/conta.sql → foto do motorista */
  driverPhoto: boolean
  /** db/gastos.sql → tabelas expenses e recurring_expenses */
  expenses: boolean
  /** db/gastos.sql → revisão agendada por quilometragem */
  maintenanceKm: boolean
}

let cache: Promise<Features> | null = null

async function hasColumn(table: string, column: string) {
  const { error } = await supabase.from(table).select(column).limit(1)
  return !error
}

async function hasTable(table: string) {
  const { error } = await supabase.from(table).select('id').limit(1)
  return !error
}

export function loadFeatures(): Promise<Features> {
  if (!cache) {
    cache = (async () => {
      const [
        vehicleDocuments,
        driverDetails,
        documentFiles,
        accountProfile,
        teamInvites,
        securityLog,
        driverPhoto,
        expenses,
        maintenanceKm,
      ] = await Promise.all([
        hasColumn('vehicles', 'licensing_due'),
        hasColumn('drivers', 'rg'),
        hasTable('documents'),
        hasColumn('profiles', 'avatar_path'),
        hasColumn('organizations', 'invite_code'),
        hasTable('security_events'),
        hasColumn('drivers', 'photo_path'),
        hasTable('expenses'),
        hasColumn('maintenances', 'scheduled_km'),
      ])
      return {
        vehicleDocuments,
        driverDetails,
        documentFiles,
        accountProfile,
        teamInvites,
        securityLog,
        driverPhoto,
        expenses,
        maintenanceKm,
      }
    })()
  }
  return cache
}

export function resetFeatures() {
  cache = null
}
