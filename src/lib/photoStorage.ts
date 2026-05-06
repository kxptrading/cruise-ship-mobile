// ─────────────────────────────────────────────────────────────────────────────
// lib/photoStorage.ts — Supabase Storage-backed photo storage (mobile)
//
// Same backend bucket and table as the web app — photos uploaded here show
// up in the web feed and vice versa. The only difference from the web port:
// addPhoto takes an expo-image-picker asset (uri-based) instead of a File.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'
import type { PhotoRecord } from '../types'

const BUCKET = 'daily-photos'
const SIGNED_URL_TTL = 3600

interface PhotoContext {
  voyageId: string
  userId:   string
}

interface VoyageContext {
  voyageId: string
}

/** Mirrors the relevant fields of an ImagePickerAsset without taking a hard
 *  dep on expo-image-picker's types here — keeps this file usable in tests. */
export interface PickedPhoto {
  uri:       string
  mimeType?: string | null
  fileName?: string | null
}

async function signedUrl(path: string): Promise<string> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
  return data?.signedUrl || ''
}

async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {}
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
  const map: Record<string, string> = {}
  ;(data || []).forEach(({ path: p, signedUrl: url }) => { if (p) map[p] = url || '' })
  return map
}

/** Read a local file:// URI into an ArrayBuffer for Supabase upload.
 *  RN's fetch() supports file:// URIs and returns a Blob via .blob(),
 *  but Supabase's upload() handles ArrayBuffer most reliably across platforms. */
async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri)
  return await res.arrayBuffer()
}

function inferExt(asset: PickedPhoto): string {
  if (asset.fileName) {
    const m = asset.fileName.split('.').pop()
    if (m) return m.toLowerCase()
  }
  if (asset.mimeType?.includes('png')) return 'png'
  if (asset.mimeType?.includes('heic')) return 'heic'
  return 'jpg'
}

export async function addPhoto(
  dayNumber: number,
  asset: PickedPhoto,
  { voyageId, userId }: PhotoContext,
  caption = '',
): Promise<PhotoRecord> {
  const ext         = inferExt(asset)
  const photoId     = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path        = `${userId}/${voyageId}/${dayNumber}/${photoId}.${ext}`
  const contentType = asset.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`
  const body        = await uriToArrayBuffer(asset.uri)

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType })

  if (uploadErr) throw uploadErr

  const { data: row, error: dbErr } = await supabase
    .from('photos')
    .insert({ voyage_id: voyageId, day_number: dayNumber, storage_path: path, caption })
    .select('id, storage_path, caption, created_at')
    .single()

  if (dbErr) throw dbErr

  return { ...(row as Omit<PhotoRecord, 'dataUrl'>), dataUrl: await signedUrl(path) }
}

export async function getPhotos(dayNumber: number, { voyageId }: VoyageContext): Promise<PhotoRecord[]> {
  const { data: rows } = await supabase
    .from('photos')
    .select('id, storage_path, caption, created_at')
    .eq('voyage_id', voyageId)
    .eq('day_number', dayNumber)
    .order('created_at', { ascending: true })

  if (!rows?.length) return []
  const urlMap = await signedUrls(rows.map((r: { storage_path: string }) => r.storage_path))
  return rows.map((row: Omit<PhotoRecord, 'dataUrl'>) => ({ ...row, dataUrl: urlMap[row.storage_path] || '' }))
}

export async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  return signedUrls(paths)
}

export async function deletePhoto(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath])
  await supabase.from('photos').delete().eq('id', id)
}

export async function updateCaption(id: string, caption: string): Promise<void> {
  await supabase.from('photos').update({ caption }).eq('id', id)
}
