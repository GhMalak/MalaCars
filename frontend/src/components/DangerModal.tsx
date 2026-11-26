import { useState } from 'react'
import { AlertBanner, Button, Field, FormActions, Modal, inputClass } from './ui'

const CONFIRM_WORD = 'EXCLUIR'

export interface ArchiveOption {
  label: string
  description: string
  run: () => Promise<void>
}

/**
 * Confirmação de exclusão em duas camadas: primeiro oferecemos arquivar
 * (que preserva o histórico) e só depois liberamos o apagar de vez,
 * exigindo que a pessoa digite a palavra de confirmação.
 */
export function DangerModal({
  title,
  entityLabel,
  impact,
  archive,
  onDelete,
  onDone,
  onClose,
}: {
  title: string
  entityLabel: string
  impact: string[]
  archive?: ArchiveOption
  onDelete: () => Promise<void>
  onDone: (result: 'archived' | 'deleted') => void
  onClose: () => void
}) {
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>, result: 'archived' | 'deleted') {
    setBusy(true)
    setError(null)
    try {
      await action()
      onDone(result)
    } catch (err: any) {
      setError(err.message || 'Não foi possível concluir a operação.')
      setBusy(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-5">
        {archive && (
          <div className="rounded-xl border border-black/10 p-4">
            <p className="font-bold text-sm">{archive.label}</p>
            <p className="text-sm text-black/60 mt-1">{archive.description}</p>
            <div className="mt-3">
              <Button onClick={() => run(archive.run, 'archived')} disabled={busy}>
                {busy ? 'Aguarde...' : archive.label}
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="font-bold text-sm text-red-700">Excluir permanentemente</p>
          <p className="text-sm text-black/60 mt-1">
            Isto apaga <strong>{entityLabel}</strong> e tudo que está ligado a ele. Não há como desfazer.
          </p>

          <ul className="mt-3 space-y-1">
            {impact.map((line) => (
              <li key={line} className="text-sm text-black/60 flex gap-2">
                <span className="text-red-500 shrink-0" aria-hidden>
                  •
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <Field label={`Digite ${CONFIRM_WORD} para liberar o botão`}>
              <input
                className={inputClass}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                placeholder={CONFIRM_WORD}
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="mt-3">
            <Button
              variant="danger"
              disabled={busy || confirmation !== CONFIRM_WORD}
              onClick={() => run(onDelete, 'deleted')}
            >
              {busy ? 'Excluindo...' : 'Excluir permanentemente'}
            </Button>
          </div>
        </div>

        {error && <AlertBanner level="danger">{error}</AlertBanner>}

        <FormActions>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
        </FormActions>
      </div>
    </Modal>
  )
}
