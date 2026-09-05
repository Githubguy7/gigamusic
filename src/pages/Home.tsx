import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { SongCard } from '@/components/SongCard'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { fetchSongs } from '@/lib/queries'
import type { SongWithAlbum } from '@/types'

export function Home() {
  const [songs, setSongs] = useState<SongWithAlbum[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { setPlaylist } = useAudioPlayer()

  useEffect(() => {
    fetchSongs()
      .then((nextSongs) => {
        setSongs(nextSongs)
        setPlaylist(nextSongs)
      })
      .catch((e: Error) => setError(e.message))
  }, [setPlaylist])

  return (
    <>
      <header className="mb-11 text-center">
        <h1 className="m-0 bg-gradient-to-br from-starlight via-[#C9C2F0] to-nebula-violet bg-clip-text font-display text-[44px] font-extrabold tracking-tight text-transparent">
          GigaMusic
        </h1>
        <p className="mt-2.5 text-[15px] text-[#8B85B0]">
          Uplifting hearts. Glorifying Jesus. Music rooted in faith.
        </p>
        <Link
          to="/upload"
          className="mt-[22px] inline-flex items-center gap-2 rounded-full border border-nebula-violet/50 bg-gradient-to-br from-nebula-violet/25 to-aurora-teal/15 px-[22px] py-3 font-display text-sm font-bold text-[#F3F1FF] no-underline"
        >
          <Plus size={16} /> Upload a song
        </Link>
      </header>

      {error && <p className="text-center text-sm text-stardust-pink">{error}</p>}
      {songs === null && !error && <p className="text-center font-mono text-sm text-muted">Loading songs…</p>}
      {songs?.length === 0 && <p className="text-center font-mono text-sm text-muted">No songs yet. Be the first to upload one.</p>}

      <div className="flex flex-col gap-[18px]">
        {songs?.map((song) => <SongCard key={song.id} song={song} />)}
      </div>
    </>
  )
}
