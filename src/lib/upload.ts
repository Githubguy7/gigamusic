import { supabase, SONGS_BUCKET, MAX_AUDIO_FILE_BYTES, ACCEPTED_AUDIO_TYPES } from '@/lib/supabase'

export function validateAudioFile(file: File): string | null {
  if (file.size > MAX_AUDIO_FILE_BYTES) {
    return `${file.name} is larger than 50MB.`
  }
  if (file.type && !ACCEPTED_AUDIO_TYPES.includes(file.type)) {
    return `${file.name} isn't a supported audio format (mp3, wav, flac).`
  }
  return null
}

export function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(file)
    const cleanup = () => URL.revokeObjectURL(url)
    audio.addEventListener('loadedmetadata', () => {
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null)
      cleanup()
    })
    audio.addEventListener('error', () => {
      resolve(null)
      cleanup()
    })
    audio.src = url
  })
}

/** Finds an existing album by title for this user, or creates one. Empty/"Singles" resolves to no album. */
export async function resolveAlbumId(userId: string, albumTitle: string): Promise<string | null> {
  const title = albumTitle.trim()
  if (!title || title.toLowerCase() === 'singles') return null

  const { data: existing, error: findError } = await supabase
    .from('albums')
    .select('id')
    .eq('user_id', userId)
    .ilike('title', title)
    .maybeSingle()
  if (findError) throw findError
  if (existing) return existing.id

  const { data: created, error: createError } = await supabase
    .from('albums')
    .insert({ user_id: userId, title, cover_image_url: null })
    .select('id')
    .single()
  if (createError) throw createError
  return created.id
}

export async function deleteSong(songId: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from(SONGS_BUCKET).remove([storagePath])
  if (storageError) throw storageError
  const { error: dbError } = await supabase.from('songs').delete().eq('id', songId)
  if (dbError) throw dbError
}

export async function uploadSongFile(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'mp3'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(SONGS_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  })
  if (error) throw error
  return path
}
