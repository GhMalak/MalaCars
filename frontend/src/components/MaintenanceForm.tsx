import { FormEvent, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { loadFeatures } from '../lib/features'
import { formatKm, todayISO } from '../lib/format'
import type { Maintenance, Vehicle } from '../lib/fleet'
import { Button, Field, FormActions, FormGrid, Modal, inputClass } from './ui'

const commonTypes = [
  'Revisão',
  'Troca de óleo',
  'Pneus',
  'Freios',
  'Suspensão',
  'Alinhamento',
  'Bateria',
  'Elétrica',
  'Funilaria',
  'Outro',
]

export function MaintenanceFormModal({
  maintenance,
  vehicles,
  defaultVehicleId,
  lockVehicle,
  onClose,
  onSaved,
}: {
  maintenance?: Maintenance | null
  vehicles: Vehicle[]
  defaultVehicleId?: string
  lockVehicle?: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [vehicleId, setVehicleId] = useState(maintenance?.vehicle_id || defaultVehicleId || '')
  const [type, setType] = useState(maintenance?.type || '')
  const [scheduledDate, setScheduledDate] = useState(maintenance?.scheduled_date || todayISO())
  const [scheduledKm, setScheduledKm] = useState(maintenance?.scheduled_km ? String(maintenance.scheduled_km) : '')
  const [kmEnabled, setKmEnabled] = useState(false)
  const [completedDate, setCompletedDate] = useState(maintenance?.completed_date || '')
  const [mileage, setMileage] = useState(maintenance?.mileage_km ? String(maintenance.mileage_km) : '')
  const [cost, setCost] = useState(maintenance?.cost ? String(maintenance.cost) : '')
  const [status, setStatus] = useState(maintenance?.status || 'agendada')
  const [notes, setNotes] = useState(maintenance?.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFeatures().then((f) => setKmEnabled(f.maintenanceKm))
  }, [])

  const vehicle = vehicles.find((v) => v.id === vehicleId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        vehicle_id: vehicleId,
        type,
        scheduled_date: scheduledDate || null,
        completed_date: completedDate || null,
        mileage_km: mileage ? Number(mileage) : null,
        cost: cost ? Number(cost) : null,
        status,
        notes: notes || null,
        ...(kmEnabled ? { scheduled_km: scheduledKm ? Number(scheduledKm) : null } : {}),
      }
      if (maintenance) {
        await api.put(`/maintenances/${maintenance.id}`, payload)
      } else {
        await api.post('/maintenances', payload)
      }
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar a manutenção.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={maintenance ? 'Editar manutenção' : 'Nova manutenção'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Veículo">
          <select required disabled={lockVehicle} className={inputClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Selecione</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {[v.plate, v.brand, v.model].filter(Boolean).join(' · ')}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Serviço">
          <input
            required
            list="maintenance-types"
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Revisão, troca de óleo..."
          />
          <datalist id="maintenance-types">
            {commonTypes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>

        <FormGrid>
          <Field label="Data agendada">
            <input type="date" className={inputClass} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          </Field>
          <Field label="Data concluída">
            <input type="date" className={inputClass} value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
          </Field>
        </FormGrid>

        {kmEnabled && (
          <Field
            label="Ou fazer na quilometragem"
            hint={
              vehicle
                ? `${vehicle.plate} está com ${formatKm(vehicle.mileage_km)}. O aviso aparece 1.000 km antes.`
                : 'O aviso aparece 1.000 km antes de bater a marca'
            }
          >
            <input
              type="number"
              min={0}
              className={inputClass}
              value={scheduledKm}
              onChange={(e) => setScheduledKm(e.target.value)}
              placeholder="Ex: 60000"
            />
          </Field>
        )}

        <FormGrid>
          <Field label="Quilometragem">
            <input type="number" className={inputClass} value={mileage} onChange={(e) => setMileage(e.target.value)} />
          </Field>
          <Field label="Custo (R$)">
            <input type="number" step="0.01" className={inputClass} value={cost} onChange={(e) => setCost(e.target.value)} />
          </Field>
        </FormGrid>

        <Field label="Status">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pendente">Pendente</option>
            <option value="agendada">Agendada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </Field>

        <Field label="Observações">
          <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
