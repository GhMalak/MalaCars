import { getOrganizationId } from './api'
import { supabase } from './supabase'

export type DocumentOwner = 'vehicle' | 'driver' | 'contract'

export interface FleetDocument {
  id: string
  owner_type: DocumentOwner
  owner_id: string
  doc_type: string
  file_path: string
  file_name: string
  expires_at?: string | null
  created_at: string
}

export const documentTypes: Record<DocumentOwner, string[]> = {
  vehicle: ['CRLV', 'Seguro', 'IPVA', 'Nota fiscal', 'Laudo', 'Foto', 'Outro'],
  driver: ['CNH', 'CPF / RG', 'Comprovante de residência', 'Antecedentes', 'Foto', 'Outro'],
  contract: ['Contrato assinado', 'Termo de entrega', 'Vistoria', 'Outro'],
}

export async function listDocuments(ownerType: DocumentOwner, ownerId: string): Promise<FleetDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as FleetDocument[]
}

export async function uploadDocument(opts: {
  ownerType: DocumentOwner
  ownerId: string
  docType: string
  expiresAt?: string | null
  file: File
}) {
  const organization_id = await getOrganizationId()
  const safeName = opts.file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${organization_id}/${opts.ownerType}/${opts.ownerId}/${Date.now()}_${safeName}`

  const upload = await supabase.storage.from('documentos').upload(path, opts.file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (upload.error) throw new Error(upload.error.message)

  const { error } = await supabase.from('documents').insert({
    organization_id,
    owner_type: opts.ownerType,
    owner_id: opts.ownerId,
    doc_type: opts.docType,
    file_path: path,
    file_name: opts.file.name,
    expires_at: opts.expiresAt || null,
  })
  if (error) throw new Error(error.message)
}

export async function openDocument(filePath: string) {
  const { data, error } = await supabase.storage.from('documentos').createSignedUrl(filePath, 3600)
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Não foi possível abrir o arquivo.')
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

export async function deleteDocument(doc: FleetDocument) {
  await supabase.storage.from('documentos').remove([doc.file_path])
  const { error } = await supabase.from('documents').delete().eq('id', doc.id)
  if (error) throw new Error(error.message)
}
