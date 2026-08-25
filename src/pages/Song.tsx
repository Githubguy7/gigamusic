import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SongCard } from '@/components/SongCard'
import { fetchSong } from '@/lib/queries'
import type { SongWithAlbum } from '@/types'

export function Song() {
  const { id } = useParams<{ id: string }>()
  const [song, setSong] = useState<SongWithAlbum | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchSong(id)
      .then(setSong)
      .catch((e: Error) => setError(e.message))
  }, [id])

  return (
    <>
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-starlight">
        <ArrowLeft size={14} /> Back to all songs
      </Link>

      {error && <p className="text-sm text-stardust-pink">{error}</p>}
      {song === undefined && !error && <p className="font-mono text-sm text-muted">Loading song…</p>}
      {song === null && <p className="font-mono text-sm text-muted">Song not found.</p>}

      {song && <SongCard song={song} lyricsDefaultOpen commentsDefaultOpen />}
    </>
  )
}
