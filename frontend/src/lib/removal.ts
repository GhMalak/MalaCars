import { api } from './api'
import { closeContract } from './contracts'
import {
  chargesOfContract,
  chargesOfDriver,
  chargesOfVehicle,
  type Charge,
  type Contract,
  type Driver,
  type Fleet,
  type Vehicle,
} from './fleet'
import { removeImage } from './photos'
import { supabase } from './supabase'
import type { DocumentOwner } from './documents'

/**
 * O que se perde ao apagar de vez um motorista, veículo ou contrato.
 * Serve para a tela avisar antes, em vez de o dono descobrir depois.
 */
export interface RemovalImpact {
  contracts: number
  charges: number
  paidCharges: number
  received: number
  open: number
  activeContract?: Contract
}

function impactFrom(contracts: Contract[], charges: Charge[], activeContract?: Contract): RemovalImpact {
  const paid = charges.filter((c) => c.status === 'pago')
  const open = charges.filter((c) => c.status !== 'pago' && c.status !== 'cancelado')
  const sum = (list: Charge[]) => list.reduce((acc, c) => acc + Number(c.amount || 0), 0)

  return {
    contracts: contracts.length,
    charges: charges.length,
    paidCharges: paid.length,
    received: sum(paid),
    open: sum(open),
    activeContract,
  }
}

export function driverImpact(fleet: Fleet, driverId: string): RemovalImpact {
  const contracts = fleet.contracts.filter((c) => c.driver_id === driverId)
  return impactFrom(
    contracts,
    chargesOfDriver(fleet.charges, fleet.contracts, driverId),
    contracts.find((c) => c.status === 'ativo'),
  )
}

export function vehicleImpact(fleet: Fleet, vehicleId: string): RemovalImpact {
  const contracts = fleet.contracts.filter((c) => c.vehicle_id === vehicleId)
  return impactFrom(
    contracts,
    chargesOfVehicle(fleet.charges, fleet.contracts, vehicleId),
    contracts.find((c) => c.status === 'ativo'),
  )
}

export function contractImpact(fleet: Fleet, contractId: string): RemovalImpact {
  const contract = fleet.contracts.find((c) => c.id === contractId)
  return impactFrom(
    contract ? [contract] : [],
    chargesOfContract(fleet.charges, contractId),
    contract?.status === 'ativo' ? contract : undefined,
  )
}

/** Frase curta para a lista de impacto na confirmação. */
export function impactLines(impact: RemovalImpact, money: (value: number) => string) {
  const lines: string[] = []
  if (impact.contracts > 0) {
    lines.push(`${impact.contracts} contrato(s) e todo o histórico de vínculos`)
  }
  if (impact.charges > 0) {
    lines.push(`${impact.charges} cobrança(s), incluindo ${impact.paidCharges} já paga(s)`)
  }
  if (impact.received > 0) {
    lines.push(`${money(impact.received)} de pagamentos recebidos saem dos relatórios`)
  }
  if (impact.open > 0) {
    lines.push(`${money(impact.open)} em aberto deixam de ser cobrados`)
  }
  lines.push('comprovantes de PIX e documentos anexados')
  return lines
}

// ---------- limpeza de arquivos no Storage ----------

// O banco apaga as linhas em cascata, mas os arquivos no Storage ficariam
// órfãos e continuariam ocupando espaço. Removemos antes de apagar o registro.
async function removeReceiptFiles(chargeIds: string[]) {
  if (chargeIds.length === 0) return
  const { data } = await supabase.from('payment_receipts').select('file_path').in('charge_id', chargeIds)
  const paths = (data || []).map((row) => row.file_path as string)
  if (paths.length > 0) {
    await supabase.storage.from('comprovantes').remove(paths)
  }
}

async function removeDocuments(ownerType: DocumentOwner, ownerIds: string[]) {
  if (ownerIds.length === 0) return
  try {
    const { data } = await supabase
      .from('documents')
      .select('file_path')
      .eq('owner_type', ownerType)
      .in('owner_id', ownerIds)
    const paths = (data || []).map((row) => row.file_path as string)
    if (paths.length > 0) {
      await supabase.storage.from('documentos').remove(paths)
    }
    await supabase.from('documents').delete().eq('owner_type', ownerType).in('owner_id', ownerIds)
  } catch {
    // instalação sem a migração db/documentos.sql: nada para limpar
  }
}

/** Devolve o veículo para "ativo" quando ele estava marcado como alugado. */
async function releaseVehicles(fleet: Fleet, contracts: Contract[]) {
  const ids = new Set(contracts.map((c) => c.vehicle_id))
  for (const id of ids) {
    const vehicle = fleet.vehicles.find((v) => v.id === id)
    if (vehicle?.status === 'alugado') {
      await api.patch(`/vehicles/${vehicle.id}`, { status: 'ativo' })
    }
  }
}

// ---------- arquivar (mantém o histórico) ----------

/** Encerra o contrato ativo, libera o veículo e marca o motorista como inativo. */
export async function archiveDriver(driver: Driver, fleet: Fleet) {
  const active = fleet.contracts.find((c) => c.driver_id === driver.id && c.status === 'ativo')
  if (active) {
    await closeContract(active, fleet.vehicles.find((v) => v.id === active.vehicle_id))
  }
  await api.patch(`/drivers/${driver.id}`, { status: 'inativo' })
}

/** Tira o veículo de operação sem apagar nada. */
export async function archiveVehicle(vehicle: Vehicle, fleet: Fleet) {
  const active = fleet.contracts.find((c) => c.vehicle_id === vehicle.id && c.status === 'ativo')
  if (active) {
    await closeContract(active, vehicle)
  }
  await api.patch(`/vehicles/${vehicle.id}`, { status: 'inativo' })
}

export async function restoreDriver(driver: Driver) {
  await api.patch(`/drivers/${driver.id}`, { status: 'ativo' })
}

export async function restoreVehicle(vehicle: Vehicle) {
  await api.patch(`/vehicles/${vehicle.id}`, { status: 'ativo' })
}

// ---------- excluir de vez ----------

export async function deleteDriver(driver: Driver, fleet: Fleet) {
  const contracts = fleet.contracts.filter((c) => c.driver_id === driver.id)
  const charges = chargesOfDriver(fleet.charges, fleet.contracts, driver.id)

  await releaseVehicles(fleet, contracts)
  await removeReceiptFiles(charges.map((c) => c.id))
  await removeDocuments('contract', contracts.map((c) => c.id))
  await removeDocuments('driver', [driver.id])
  await removeImage(driver.photo_path)
  await api.del(`/drivers/${driver.id}`)
}

export async function deleteVehicle(vehicle: Vehicle, fleet: Fleet) {
  const contracts = fleet.contracts.filter((c) => c.vehicle_id === vehicle.id)
  const charges = chargesOfVehicle(fleet.charges, fleet.contracts, vehicle.id)

  await removeReceiptFiles(charges.map((c) => c.id))
  await removeDocuments('contract', contracts.map((c) => c.id))
  await removeDocuments('vehicle', [vehicle.id])
  await api.del(`/vehicles/${vehicle.id}`)
}

export async function deleteContract(contract: Contract, fleet: Fleet) {
  const charges = chargesOfContract(fleet.charges, contract.id)

  await releaseVehicles(fleet, [contract])
  await removeReceiptFiles(charges.map((c) => c.id))
  await removeDocuments('contract', [contract.id])
  await api.del(`/contracts/${contract.id}`)
}
