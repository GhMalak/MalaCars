import { api } from './api'
import { todayISO } from './format'
import { activeContractForDriver, activeContractForVehicle, type Contract, type Vehicle } from './fleet'

export interface ContractInput {
  id?: string
  vehicle_id: string
  driver_id: string
  start_date: string
  end_date?: string | null
  weekly_value: number
  due_weekday: number
  status: string
  notes?: string | null
}

/** Encerra o contrato e libera o veículo se ele estava marcado como alugado. */
export async function closeContract(contract: Contract, vehicle?: Vehicle | null) {
  await api.patch(`/contracts/${contract.id}`, {
    status: 'encerrado',
    end_date: contract.end_date || todayISO(),
  })
  if (vehicle?.status === 'alugado') {
    await api.patch(`/vehicles/${vehicle.id}`, { status: 'ativo' })
  }
}

/**
 * Salva o contrato garantindo que um veículo ou motorista não fique com dois
 * vínculos ativos ao mesmo tempo: o anterior é encerrado automaticamente.
 */
export async function saveContract(
  input: ContractInput,
  context: { contracts: Contract[]; vehicles: Vehicle[] },
) {
  if (input.status === 'ativo') {
    const conflicts = [
      activeContractForVehicle(context.contracts, input.vehicle_id),
      activeContractForDriver(context.contracts, input.driver_id),
    ].filter((c): c is Contract => Boolean(c) && c!.id !== input.id)

    const seen = new Set<string>()
    for (const conflict of conflicts) {
      if (seen.has(conflict.id)) continue
      seen.add(conflict.id)
      await closeContract(conflict, context.vehicles.find((v) => v.id === conflict.vehicle_id))
    }
  }

  const payload = {
    vehicle_id: input.vehicle_id,
    driver_id: input.driver_id,
    start_date: input.start_date,
    end_date: input.end_date || null,
    weekly_value: input.weekly_value,
    due_weekday: input.due_weekday,
    status: input.status,
    notes: input.notes || null,
  }

  const contract = input.id
    ? await api.put(`/contracts/${input.id}`, payload)
    : await api.post('/contracts', payload)

  const vehicle = context.vehicles.find((v) => v.id === input.vehicle_id)
  if (input.status === 'ativo' && vehicle && vehicle.status === 'ativo') {
    await api.patch(`/vehicles/${vehicle.id}`, { status: 'alugado' })
  }

  return contract as Contract
}
