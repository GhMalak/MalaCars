import { FormEvent, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { loadFeatures } from '../lib/features'
import type { Vehicle } from '../lib/fleet'
import { Button, Field, FormActions, FormGrid, Modal, inputClass } from './ui'

const emptyForm = {
  plate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  mileage_km: '0',
  status: 'ativo',
  renavam: '',
  chassis: '',
  licensing_due: '',
  ipva_due: '',
  insurer: '',
  insurance_due: '',
  purchase_date: '',
  purchase_value: '',
  notes: '',
}

type Form = typeof emptyForm

function toForm(vehicle: Vehicle): Form {
  return {
    plate: vehicle.plate,
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    year: vehicle.year ? String(vehicle.year) : '',
    color: vehicle.color || '',
    mileage_km: String(vehicle.mileage_km ?? 0),
    status: vehicle.status,
    renavam: vehicle.renavam || '',
    chassis: vehicle.chassis || '',
    licensing_due: vehicle.licensing_due || '',
    ipva_due: vehicle.ipva_due || '',
    insurer: vehicle.insurer || '',
    insurance_due: vehicle.insurance_due || '',
    purchase_date: vehicle.purchase_date || '',
    purchase_value: vehicle.purchase_value ? String(vehicle.purchase_value) : '',
    notes: vehicle.notes || '',
  }
}

export function VehicleFormModal({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle?: Vehicle | null
  onClose: () => void
  onSaved: (vehicle: Vehicle) => void
}) {
  const [form, setForm] = useState<Form>(vehicle ? toForm(vehicle) : emptyForm)
  const [documentsEnabled, setDocumentsEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFeatures().then((f) => setDocumentsEnabled(f.vehicleDocuments))
  }, [])

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        plate: form.plate.trim().toUpperCase(),
        brand: form.brand || null,
        model: form.model || null,
        year: form.year ? Number(form.year) : null,
        color: form.color || null,
        mileage_km: Number(form.mileage_km || 0),
        status: form.status,
        notes: form.notes || null,
      }
      if (documentsEnabled) {
        Object.assign(payload, {
          renavam: form.renavam || null,
          chassis: form.chassis || null,
          licensing_due: form.licensing_due || null,
          ipva_due: form.ipva_due || null,
          insurer: form.insurer || null,
          insurance_due: form.insurance_due || null,
          purchase_date: form.purchase_date || null,
          purchase_value: form.purchase_value ? Number(form.purchase_value) : null,
        })
      }

      const saved = vehicle
        ? await api.put(`/vehicles/${vehicle.id}`, payload)
        : await api.post('/vehicles', payload)
      onSaved(saved as Vehicle)
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar o veículo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={vehicle ? `Editar ${vehicle.plate}` : 'Novo veículo'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Placa">
          <input
            required
            autoFocus={!vehicle}
            className={inputClass}
            value={form.plate}
            onChange={(e) => set('plate', e.target.value.toUpperCase())}
            placeholder="ABC1D23"
          />
        </Field>
        <FormGrid>
          <Field label="Marca">
            <input className={inputClass} value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Chevrolet" />
          </Field>
          <Field label="Modelo">
            <input className={inputClass} value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="Onix" />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Ano">
            <input type="number" className={inputClass} value={form.year} onChange={(e) => set('year', e.target.value)} />
          </Field>
          <Field label="Cor">
            <input className={inputClass} value={form.color} onChange={(e) => set('color', e.target.value)} />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Quilometragem">
            <input type="number" className={inputClass} value={form.mileage_km} onChange={(e) => set('mileage_km', e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="alugado">Alugado</option>
              <option value="em_manutencao">Em manutenção</option>
              <option value="inativo">Inativo</option>
            </select>
          </Field>
        </FormGrid>

        {documentsEnabled && (
          <div className="space-y-4 pt-2 border-t border-black/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-black/40 pt-2">Documentação</p>
            <FormGrid>
              <Field label="Renavam">
                <input className={inputClass} value={form.renavam} onChange={(e) => set('renavam', e.target.value)} />
              </Field>
              <Field label="Chassi">
                <input className={inputClass} value={form.chassis} onChange={(e) => set('chassis', e.target.value)} />
              </Field>
            </FormGrid>
            <FormGrid>
              <Field label="Licenciamento vence em">
                <input type="date" className={inputClass} value={form.licensing_due} onChange={(e) => set('licensing_due', e.target.value)} />
              </Field>
              <Field label="IPVA vence em">
                <input type="date" className={inputClass} value={form.ipva_due} onChange={(e) => set('ipva_due', e.target.value)} />
              </Field>
            </FormGrid>
            <FormGrid>
              <Field label="Seguradora">
                <input className={inputClass} value={form.insurer} onChange={(e) => set('insurer', e.target.value)} />
              </Field>
              <Field label="Seguro vence em">
                <input type="date" className={inputClass} value={form.insurance_due} onChange={(e) => set('insurance_due', e.target.value)} />
              </Field>
            </FormGrid>
            <FormGrid>
              <Field label="Data da compra">
                <input type="date" className={inputClass} value={form.purchase_date} onChange={(e) => set('purchase_date', e.target.value)} />
              </Field>
              <Field label="Valor da compra (R$)">
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={form.purchase_value}
                  onChange={(e) => set('purchase_value', e.target.value)}
                />
              </Field>
            </FormGrid>
          </div>
        )}

        <Field label="Observações">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar veículo'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
