import { supabase } from './supabase'
import { api, getOrganizationId } from './api'

export interface PaymentReceipt {
  id: string
  charge_id: string
  file_path: string
  file_name: string
  created_at: string
}

export async function listReceipts(): Promise<PaymentReceipt[]> {
  return api.get('/payment-receipts')
}

export async function uploadReceipt(chargeId: string, file: File) {
  const orgId = await getOrganizationId()
  const safeName = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${orgId}/${chargeId}/${Date.now()}_${safeName}`
  const { error } = await supabase.storage.from('comprovantes').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return api.post('/payment-receipts', {
    charge_id: chargeId,
    file_path: path,
    file_name: file.name,
  })
}

export async function openReceipt(filePath: string) {
  const { data, error } = await supabase.storage.from('comprovantes').createSignedUrl(filePath, 3600)
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Não foi possível abrir o comprovante.')
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

export async function deleteReceipt(receipt: PaymentReceipt) {
  await supabase.storage.from('comprovantes').remove([receipt.file_path])
  await api.del(`/payment-receipts/${receipt.id}`)
}
