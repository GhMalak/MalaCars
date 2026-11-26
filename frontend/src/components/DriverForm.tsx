import { FormEvent, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { loadFeatures } from '../lib/features'
import type { Driver } from '../lib/fleet'
import { removeImage, uploadDriverPhoto } from '../lib/photos'
import { Avatar } from './Avatar'
import { Button, Field, FormActions, FormGrid, Modal, inputClass } from './ui'

const emptyForm = {
  full_name: '',
  cpf: '',
  phone: '',
  cnh_number: '',
  cnh_category: '',
  cnh_expiration: '',
  status: 'ativo',
  rg: '',
  birth_date: '',
  address: '',
  emergency_name: '',
  emergency_phone: '',
  notes: '',
}

type Form = typeof emptyForm

function toForm(driver: Driver): Form {
  return {
    full_name: driver.full_name,
    cpf: driver.cpf || '',
    phone: driver.phone || '',
    cnh_number: driver.cnh_number || '',
    cnh_category: driver.cnh_category || '',
    cnh_expiration: driver.cnh_expiration || '',
    status: driver.status,
    rg: driver.rg || '',
    birth_date: driver.birth_date || '',
    address: driver.address || '',
    emergency_name: driver.emergency_name || '',
    emergency_phone: driver.emergency_phone || '',
    notes: driver.notes || '',
  }
}

export function DriverFormModal({
  driver,
  onClose,
  onSaved,
}: {
  driver?: Driver | null
  onClose: () => void
  onSaved: (driver: Driver) => void
}) {
  const [form, setForm] = useState<Form>(driver ? toForm(driver) : emptyForm)
  const [detailsEnabled, setDetailsEnabled] = useState(false)
  const [photoEnabled, setPhotoEnabled] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFeatures().then((f) => {
      setDetailsEnabled(f.driverDetails)
      setPhotoEnabled(f.driverPhoto)
    })
  }, [])

  // Solta a URL temporária do preview para não vazar memória.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  function pickPhoto(file?: File) {
    if (!file) return
    setError(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setRemovePhoto(false)
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(Boolean(driver?.photo_path))
  }

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        full_name: form.full_name.trim(),
        cpf: form.cpf || null,
        phone: form.phone || null,
        cnh_number: form.cnh_number || null,
        cnh_category: form.cnh_category || null,
        cnh_expiration: form.cnh_expiration || null,
        status: form.status,
        notes: form.notes || null,
      }
      if (detailsEnabled) {
        Object.assign(payload, {
          rg: form.rg || null,
          birth_date: form.birth_date || null,
          address: form.address || null,
          emergency_name: form.emergency_name || null,
          emergency_phone: form.emergency_phone || null,
        })
      }

      if (photoEnabled && removePhoto && !photoFile) {
        payload.photo_path = null
      }

      let saved = (driver
        ? await api.put(`/drivers/${driver.id}`, payload)
        : await api.post('/drivers', payload)) as Driver

      // A foto só sobe depois de salvar, porque o caminho no Storage usa o id.
      if (photoEnabled && photoFile) {
        const path = await uploadDriverPhoto(saved.id, photoFile, driver?.photo_path)
        saved = (await api.patch(`/drivers/${saved.id}`, { photo_path: path })) as Driver
      } else if (photoEnabled && removePhoto) {
        await removeImage(driver?.photo_path)
      }

      onSaved(saved)
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar o motorista.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={driver ? `Editar ${driver.full_name}` : 'Novo motorista'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {photoEnabled && (
          <div className="flex items-center gap-4">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Pré-visualização da foto"
                className="h-20 w-20 rounded-full object-cover border border-black/10"
              />
            ) : (
              <Avatar
                name={form.full_name}
                path={removePhoto ? null : driver?.photo_path}
                size="lg"
              />
            )}
            <div className="flex flex-wrap gap-3">
              <label className="text-sm font-semibold text-brand cursor-pointer min-h-11 inline-flex items-center">
                {driver?.photo_path || photoFile ? 'Trocar foto' : 'Adicionar foto'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    pickPhoto(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
              {(photoFile || (driver?.photo_path && !removePhoto)) && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="text-sm font-semibold text-red-600 min-h-11 inline-flex items-center"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        )}

        <Field label="Nome completo">
          <input
            required
            autoFocus={!driver}
            className={inputClass}
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
          />
        </Field>
        <FormGrid>
          <Field label="Telefone / WhatsApp" hint="Usado nos lembretes">
            <input
              type="tel"
              className={inputClass}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </Field>
          <Field label="CPF">
            <input className={inputClass} value={form.cpf} onChange={(e) => set('cpf', e.target.value)} />
          </Field>
        </FormGrid>

        <div className="space-y-4 pt-2 border-t border-black/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/40 pt-2">CNH</p>
          <FormGrid>
            <Field label="Número da CNH">
              <input className={inputClass} value={form.cnh_number} onChange={(e) => set('cnh_number', e.target.value)} />
            </Field>
            <Field label="Categoria">
              <select className={inputClass} value={form.cnh_category} onChange={(e) => set('cnh_category', e.target.value)}>
                <option value="">Selecione</option>
                {['A', 'B', 'AB', 'C', 'D', 'E'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="CNH vence em">
              <input type="date" className={inputClass} value={form.cnh_expiration} onChange={(e) => set('cnh_expiration', e.target.value)} />
            </Field>
            <Field label="Status">
              <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
          </FormGrid>
        </div>

        {detailsEnabled && (
          <div className="space-y-4 pt-2 border-t border-black/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-black/40 pt-2">Dados pessoais</p>
            <FormGrid>
              <Field label="RG">
                <input className={inputClass} value={form.rg} onChange={(e) => set('rg', e.target.value)} />
              </Field>
              <Field label="Nascimento">
                <input type="date" className={inputClass} value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} />
              </Field>
            </FormGrid>
            <Field label="Endereço">
              <input className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <FormGrid>
              <Field label="Contato de emergência">
                <input className={inputClass} value={form.emergency_name} onChange={(e) => set('emergency_name', e.target.value)} />
              </Field>
              <Field label="Telefone de emergência">
                <input type="tel" className={inputClass} value={form.emergency_phone} onChange={(e) => set('emergency_phone', e.target.value)} />
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
            {saving ? 'Salvando...' : 'Salvar motorista'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
