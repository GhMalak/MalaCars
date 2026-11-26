import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  deleteDocument,
  documentTypes,
  listDocuments,
  openDocument,
  uploadDocument,
  type DocumentOwner,
  type FleetDocument,
} from '../lib/documents'
import { loadFeatures } from '../lib/features'
import { deadlineLabel, formatDate } from '../lib/format'
import { AlertBanner, Button, Field, FormActions, FormGrid, Modal, SectionCard, cardActionClass, inputClass } from './ui'

export function DocumentsPanel({
  ownerType,
  ownerId,
  title = 'Arquivos',
  hint,
}: {
  ownerType: DocumentOwner
  ownerId: string
  title?: string
  hint?: string
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [documents, setDocuments] = useState<FleetDocument[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    listDocuments(ownerType, ownerId)
      .then(setDocuments)
      .catch((e) => setError(e.message))
  }, [ownerType, ownerId])

  useEffect(() => {
    loadFeatures().then((features) => {
      setEnabled(features.documentFiles)
      if (features.documentFiles) load()
    })
  }, [load])

  if (enabled === null) return null

  if (!enabled) {
    return (
      <SectionCard title={title} hint={hint}>
        <AlertBanner level="info">
          Para guardar CNH, CRLV e contratos assinados, rode o arquivo <strong>db/documentos.sql</strong> no SQL Editor do
          Supabase.
        </AlertBanner>
      </SectionCard>
    )
  }

  async function handleDelete(doc: FleetDocument) {
    if (!confirm(`Excluir ${doc.file_name}?`)) return
    try {
      await deleteDocument(doc)
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <>
      <SectionCard
        title={title}
        hint={hint}
        action={
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            + Anexar
          </Button>
        }
        padded={documents.length === 0}
      >
        {error && <p className="px-4 pt-3 text-sm text-red-600">{error}</p>}
        {documents.length === 0 ? (
          <p className="text-sm text-black/40">Nenhum arquivo anexado ainda.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {documents.map((doc) => (
              <li key={doc.id} className="px-4 sm:px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{doc.doc_type}</div>
                    <div className="text-xs text-black/50 mt-0.5 break-all">{doc.file_name}</div>
                    {doc.expires_at && (
                      <div className="text-xs text-black/50 mt-0.5">
                        Validade {formatDate(doc.expires_at)} · {deadlineLabel(doc.expires_at)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-1">
                  <button onClick={() => openDocument(doc.file_path)} className={`${cardActionClass} text-brand`}>
                    Abrir
                  </button>
                  <button onClick={() => handleDelete(doc)} className={`${cardActionClass} text-red-600`}>
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {uploadOpen && (
        <UploadModal
          ownerType={ownerType}
          ownerId={ownerId}
          onClose={() => setUploadOpen(false)}
          onSaved={() => {
            setUploadOpen(false)
            load()
          }}
        />
      )}
    </>
  )
}

function UploadModal({
  ownerType,
  ownerId,
  onClose,
  onSaved,
}: {
  ownerType: DocumentOwner
  ownerId: string
  onClose: () => void
  onSaved: () => void
}) {
  const types = documentTypes[ownerType]
  const [docType, setDocType] = useState(types[0])
  const [expiresAt, setExpiresAt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Escolha um arquivo.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await uploadDocument({ ownerType, ownerId, docType, expiresAt: expiresAt || null, file })
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Não foi possível enviar o arquivo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Anexar arquivo" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormGrid>
          <Field label="Tipo">
            <select className={inputClass} value={docType} onChange={(e) => setDocType(e.target.value)}>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Validade (opcional)">
            <input type="date" className={inputClass} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </Field>
        </FormGrid>
        <Field label="Arquivo" hint="Foto ou PDF, até 10 MB">
          <input
            type="file"
            accept="image/*,.pdf"
            required
            className={inputClass}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Enviando...' : 'Enviar'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
