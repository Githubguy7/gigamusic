import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project credentials.',
  )
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
