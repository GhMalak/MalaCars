import { getOrganizationId } from './api'
import { supabase } from './supabase'

/**
 * Bucket privado de imagens de pessoas (avatar do usuário e foto do motorista).
 * A primeira pasta do caminho é sempre o id da empresa — é o que a política
 * de Storage usa para isolar os dados de cada frota.
 */
const BUCKET = 'avatares'

export const maxPhotoBytes = 2 * 1024 * 1024

function extensionOf(file: File) {
  const raw = (file.name.split('.').pop() || 'jpg').toLowerCase()
  return /^(jpg|jpeg|png|webp)$/.test(raw) ? raw : 'jpg'
}

export async function uploadImage(file: File, folder: string, name: string) {
  if (file.size > maxPhotoBytes) {
    throw new Error('A imagem precisa ter no máximo 2 MB.')
  }
  const organizationId = await getOrganizationId()
  const path = [organizationId, folder, `${name}.${extensionOf(file)}`].filter(Boolean).join('/')

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw new Error(error.message)
  return path
}

export async function removeImage(path?: string | null) {
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}

export async function imageUrl(path?: string | null) {
  if (!path) return null
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl || null
}

// ---------- foto do motorista ----------

export async function uploadDriverPhoto(driverId: string, file: File, previousPath?: string | null) {
  const path = await uploadImage(file, 'drivers', driverId)
  if (previousPath && previousPath !== path) {
    await removeImage(previousPath)
  }
  return path
}
