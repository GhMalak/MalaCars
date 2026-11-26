import { FormEvent, useEffect, useMemo, useState } from 'react'
import { loadPreferences } from '../lib/account'
import { saveContract } from '../lib/contracts'
import { money, todayISO, weekdays } from '../lib/format'
import {
  activeContractForDriver,
  activeContractForVehicle,
  type Contract,
  type Driver,
  type Vehicle,
} from '../lib/fleet'
import { DriverFormModal } from './DriverForm'
import { VehicleFormModal } from './VehicleForm'
import { AlertBanner, Button, Field, FormActions, FormGrid, Modal, inputClass } from './ui'

const NEW = '__new__'

export function ContractModal({
  contract,
  vehicles,
  drivers,
  contracts,
  defaultVehicleId,
  defaultDriverId,
  onClose,
  onSaved,
}: {
  contract?: Contract | null
  vehicles: Vehicle[]
  drivers: Driver[]
  contracts: Contract[]
  defaultVehicleId?: string
  defaultDriverId?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [vehicleList, setVehicleList] = useState(vehicles)
  const [driverList, setDriverList] = useState(drivers)
  const [vehicleId, setVehicleId] = useState(contract?.vehicle_id || defaultVehicleId || '')
  const [driverId, setDriverId] = useState(contract?.driver_id || defaultDriverId || '')
  const [weeklyValue, setWeeklyValue] = useState(contract ? String(contract.weekly_value) : '')
  const [dueWeekday, setDueWeekday] = useState(String(contract?.due_weekday ?? 1))
  const [startDate, setStartDate] = useState(contract?.start_date || todayISO())
  const [endDate, setEndDate] = useState(contract?.end_date || '')
  const [status, setStatus] = useState(contract?.status || 'ativo')
  const [notes, setNotes] = useState(contract?.notes || '')
  const [newVehicleOpen, setNewVehicleOpen] = useState(false)
  const [newDriverOpen, setNewDriverOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Em contrato novo, começamos no dia de recebimento preferido do usuário.
  useEffect(() => {
    if (contract) return
    loadPreferences().then((preferences) => setDueWeekday(String(preferences.defaultDueWeekday)))
  }, [contract])

  // Arquivados ficam fora das listas — a não ser o já escolhido no contrato em edição.
  const selectableVehicles = useMemo(
    () => vehicleList.filter((v) => v.status !== 'inativo' || v.id === vehicleId),
    [vehicleList, vehicleId],
  )
  const selectableDrivers = useMemo(
    () => driverList.filter((d) => d.status === 'ativo' || d.id === driverId),
    [driverList, driverId],
  )

  const replacing = useMemo(() => {
    if (status !== 'ativo') return []
    const items: string[] = []
    const vehicleConflict = activeContractForVehicle(contracts, vehicleId)
    const driverConflict = activeContractForDriver(contracts, driverId)
    if (vehicleConflict && vehicleConflict.id !== contract?.id) {
      const current = driverList.find((d) => d.id === vehicleConflict.driver_id)
      items.push(`O veículo já está com ${current?.full_name || 'outro motorista'}.`)
    }
    if (driverConflict && driverConflict.id !== contract?.id) {
      const current = vehicleList.find((v) => v.id === driverConflict.vehicle_id)
      items.push(`O motorista já está com o veículo ${current?.plate || 'anterior'}.`)
    }
    return items
  }, [contract?.id, contracts, driverId, driverList, status, vehicleId, vehicleList])

  const monthly = Number(weeklyValue || 0) * 4.33

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await saveContract(
        {
          id: contract?.id,
          vehicle_id: vehicleId,
          driver_id: driverId,
          start_date: startDate,
          end_date: endDate || null,
          weekly_value: Number(weeklyValue || 0),
          due_weekday: Number(dueWeekday),
          status,
          notes: notes || null,
        },
        { contracts, vehicles: vehicleList },
      )
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar o contrato.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal title={contract ? 'Editar contrato' : 'Novo contrato'} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Veículo" hint="Não está na lista? Cadastre aqui mesmo.">
            <select
              required
              className={inputClass}
              value={vehicleId}
              onChange={(e) => {
                if (e.target.value === NEW) {
                  setNewVehicleOpen(true)
                  return
                }
                setVehicleId(e.target.value)
              }}
            >
              <option value="">Selecione o veículo</option>
              {selectableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.plate, v.brand, v.model].filter(Boolean).join(' · ')}
                </option>
              ))}
              <option value={NEW}>+ Cadastrar novo veículo</option>
            </select>
          </Field>

          <Field label="Motorista" hint="Não está na lista? Cadastre aqui mesmo.">
            <select
              required
              className={inputClass}
              value={driverId}
              onChange={(e) => {
                if (e.target.value === NEW) {
                  setNewDriverOpen(true)
                  return
                }
                setDriverId(e.target.value)
              }}
            >
              <option value="">Selecione o motorista</option>
              {selectableDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
              <option value={NEW}>+ Cadastrar novo motorista</option>
            </select>
          </Field>

          <FormGrid>
            <Field label="Valor semanal (R$)">
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={weeklyValue}
                onChange={(e) => setWeeklyValue(e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Dia do recebimento">
              <select className={inputClass} value={dueWeekday} onChange={(e) => setDueWeekday(e.target.value)}>
                {weekdays.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </Field>
          </FormGrid>

          {Number(weeklyValue) > 0 && (
            <p className="text-xs text-black/50">
              Equivale a cerca de <strong>{money(monthly)}</strong> por mês.
            </p>
          )}

          <FormGrid>
            <Field label="Início">
              <input type="date" required className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Fim (opcional)">
              <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </FormGrid>

          <Field label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </Field>

          <Field label="Observações">
            <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          {replacing.length > 0 && (
            <AlertBanner level="warning">
              {replacing.join(' ')} O vínculo anterior será encerrado automaticamente.
            </AlertBanner>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormActions>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : contract ? 'Salvar contrato' : 'Criar contrato'}
            </Button>
          </FormActions>
        </form>
      </Modal>

      {newVehicleOpen && (
        <VehicleFormModal
          onClose={() => setNewVehicleOpen(false)}
          onSaved={(vehicle) => {
            setVehicleList((list) => [...list, vehicle].sort((a, b) => a.plate.localeCompare(b.plate)))
            setVehicleId(vehicle.id)
            setNewVehicleOpen(false)
          }}
        />
      )}

      {newDriverOpen && (
        <DriverFormModal
          onClose={() => setNewDriverOpen(false)}
          onSaved={(driver) => {
            setDriverList((list) => [...list, driver].sort((a, b) => a.full_name.localeCompare(b.full_name)))
            setDriverId(driver.id)
            setNewDriverOpen(false)
          }}
        />
      )}
    </>
  )
}
