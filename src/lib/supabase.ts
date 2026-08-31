import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

// GigaMusic's publishable browser credentials. Vite environment variables can
// still override these for staging/alternate deployments.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://orkobwtacpjdferhzqtq.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iwNYOnqJerbxAh0gXpJHkQ_1ITKDq3v'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase browser credentials.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const SONGS_BUCKET = 'songs'
export const COVERS_BUCKET = 'covers'

export const MAX_AUDIO_FILE_BYTES = 50 * 1024 * 1024 // 50MB, matches storage policy
export const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/mp3']

export function getPublicAudioUrl(storagePath: string): string {
  return supabase.storage.from(SONGS_BUCKET).getPublicUrl(storagePath).data.publicUrl
}

export function getAudioDownloadUrl(storagePath: string, downloadFileName: string): string {
  return supabase.storage.from(SONGS_BUCKET).getPublicUrl(storagePath, { download: downloadFileName }).data
    .publicUrl
}

export function getPublicCoverUrl(storagePath: string | null): string | null {
  if (!storagePath) return null
  return supabase.storage.from(COVERS_BUCKET).getPublicUrl(storagePath).data.publicUrl
}
