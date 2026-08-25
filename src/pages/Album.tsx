import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SongCard } from '@/components/SongCard'
import { fetchAlbum, fetchAlbumSongs } from '@/lib/queries'
import type { Album as AlbumType, SongWithAlbum } from '@/types'

export function Album() {
  const { id } = useParams<{ id: string }>()
  const [album, setAlbum] = useState<AlbumType | null | undefined>(undefined)
  const [songs, setSongs] = useState<SongWithAlbum[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchAlbum(id), fetchAlbumSongs(id)])
      .then(([a, s]) => {
        setAlbum(a)
        setSongs(s)
      })
      .catch((e: Error) => setError(e.message))
  }, [id])

  return (
    <>
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-starlight">
        <ArrowLeft size={14} /> Back to all songs
      </Link>

      {error && <p className="text-sm text-stardust-pink">{error}</p>}
      {album === undefined && !error && <p className="font-mono text-sm text-muted">Loading album…</p>}
      {album === null && <p className="font-mono text-sm text-muted">Album not found.</p>}

      {album && (
        <header className="mb-8">
          <h1 className="m-0 font-display text-[32px] font-extrabold text-starlight">{album.title}</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {songs?.length ?? 0} {songs?.length === 1 ? 'song' : 'songs'}
          </p>
        </header>
      )}

      <div className="flex flex-col gap-[18px]">
        {songs?.map((song) => <SongCard key={song.id} song={song} />)}
      </div>
    </>
  )
}
