import JSZip from 'jszip'
import { supabase, getPublicAudioUrl } from '@/lib/supabase'
import type { Album, Comment, Song } from '@/types'

export interface ExportProgress {
  done: number
  total: number
  currentTitle: string
}

/**
 * Client-side "Export everything": zips every song's audio file alongside a
 * metadata.json of albums/songs/comments, and triggers a browser download.
 * Runs entirely against the public-read tables/storage, so it needs no
 * service-role key — unlike the nightly Edge Function backup, which also
 * mirrors to a second, Michael-controlled location.
 */
export async function exportEverything(onProgress?: (p: ExportProgress) => void): Promise<void> {
  const [albumsRes, songsRes, commentsRes] = await Promise.all([
    supabase.from('albums').select('*'),
    supabase.from('songs').select('*'),
    supabase.from('comments').select('*'),
  ])
  if (albumsRes.error) throw albumsRes.error
  if (songsRes.error) throw songsRes.error
  if (commentsRes.error) throw commentsRes.error

  const albums = albumsRes.data as Album[]
  const songs = songsRes.data as Song[]
  const comments = commentsRes.data as Comment[]

  const zip = new JSZip()
  zip.file(
    'metadata.json',
    JSON.stringify({ exported_at: new Date().toISOString(), albums, songs, comments }, null, 2),
  )
  const audioFolder = zip.folder('audio')!

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    onProgress?.({ done: i, total: songs.length, currentTitle: song.title })
    try {
      const res = await fetch(getPublicAudioUrl(song.audio_storage_path))
      if (!res.ok) continue
      const blob = await res.blob()
      const ext = song.audio_storage_path.split('.').pop() || 'mp3'
      const safeTitle = song.title.replace(/[/\\?%*:|"<>]/g, '-')
      audioFolder.file(`${safeTitle}-${song.id}.${ext}`, blob)
    } catch {
      // Keep going — a single unreachable file shouldn't abort the whole export.
    }
  }
  onProgress?.({ done: songs.length, total: songs.length, currentTitle: '' })

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gigamusic-export-${new Date().toISOString().slice(0, 10)}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
