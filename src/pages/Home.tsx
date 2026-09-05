import { useEffect, useMemo, useState } from 'react'
import { Headphones, Music2, Play, Search } from 'lucide-react'
import { SongCard } from '@/components/SongCard'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { fetchSongs } from '@/lib/queries'
import type { SongWithAlbum } from '@/types'

export function Home() {
  const [songs, setSongs] = useState<SongWithAlbum[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('All')
  const { setPlaylist, toggle } = useAudioPlayer()

  useEffect(() => {
    fetchSongs()
      .then((nextSongs) => {
        setSongs(nextSongs)
        setPlaylist(nextSongs)
      })
      .catch((e: Error) => setError(e.message))
  }, [setPlaylist])

  const genres = useMemo(() => {
    const values = new Set((songs ?? []).map((song) => song.genre).filter(Boolean))
    return ['All', ...Array.from(values).sort()]
  }, [songs])

  const filteredSongs = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (songs ?? []).filter((song) => {
      const matchesGenre = genre === 'All' || song.genre === genre
      const haystack = `${song.title} ${song.artist_name} ${song.album?.title ?? ''} ${song.genre ?? ''} ${song.scripture_reference ?? ''}`.toLowerCase()
      return matchesGenre && (!needle || haystack.includes(needle))
    })
  }, [songs, query, genre])

  const featured = songs?.[0]

  return (
    <>
      <section className="relative mb-9 overflow-hidden rounded-[28px] border border-nebula-violet/25 bg-[radial-gradient(circle_at_72%_25%,rgba(139,111,232,0.28),transparent_34%),radial-gradient(circle_at_18%_78%,rgba(79,216,196,0.15),transparent_30%),rgba(9,9,25,0.72)] px-6 py-9 shadow-[0_20px_70px_rgba(0,0,0,0.38)] sm:px-10 sm:py-12">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 12% 20%, rgba(255,255,255,.7) 0 1px, transparent 1.3px), radial-gradient(circle at 78% 18%, rgba(255,255,255,.45) 0 1px, transparent 1.3px), radial-gradient(circle at 86% 68%, rgba(79,216,196,.5) 0 1px, transparent 1.3px), radial-gradient(circle at 34% 76%, rgba(245,205,112,.45) 0 1px, transparent 1.3px)' }} />
        <div className="relative z-10 max-w-[690px]">
          <span className="font-mono text-[10px] uppercase tracking-[2.6px] text-aurora-teal">Christian music for worship, reflection & hope</span>
          <h1 className="mb-0 mt-3 bg-gradient-to-br from-white via-[#D8D2F7] to-nebula-violet bg-clip-text font-display text-[42px] font-extrabold leading-[1.04] tracking-tight text-transparent sm:text-[58px]">
            Uplifting hearts.<br />Glorifying Jesus.
          </h1>
          <p className="mb-0 mt-4 max-w-[580px] text-[15px] leading-7 text-[#AAA5C9] sm:text-base">
            Discover faith-filled songs rooted in Scripture, worship and the hope of Christ. Listen freely, explore the message, and share the music with others.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {featured && <button type="button" onClick={() => toggle(featured)} className="inline-flex items-center gap-2 rounded-full border border-aurora-teal/35 bg-aurora-teal/10 px-5 py-3 font-display text-sm font-bold text-[#EFFFFB] hover:bg-aurora-teal/15"><Play size={16} /> Start listening</button>}
            <a href="#music-library" className="inline-flex items-center gap-2 rounded-full border border-nebula-violet/35 bg-nebula-violet/10 px-5 py-3 font-display text-sm font-bold text-[#E9E5FF] no-underline hover:bg-nebula-violet/15"><Music2 size={16} /> Explore music</a>
          </div>
        </div>
      </section>

      {featured && (
        <section className="mb-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center rounded-[20px] border border-comet-gold/15 bg-[linear-gradient(120deg,rgba(245,205,112,0.07),rgba(139,111,232,0.08),rgba(79,216,196,0.05))] p-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[2px] text-comet-gold">Featured from GigaMusic</div>
            <h2 className="mb-1 mt-2 font-display text-2xl font-bold text-[#F3F1FF]">{featured.title}</h2>
            <p className="m-0 text-sm text-[#9892B9]">{featured.artist_name}{featured.album?.title ? ` · ${featured.album.title}` : ''}{featured.genre ? ` · ${featured.genre}` : ''}</p>
          </div>
          <button type="button" onClick={() => toggle(featured)} className="inline-flex items-center justify-center gap-2 rounded-full border border-comet-gold/30 px-5 py-2.5 font-display text-sm font-semibold text-comet-gold"><Headphones size={16} /> Listen now</button>
        </section>
      )}

      <section id="music-library" className="scroll-mt-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="font-mono text-[9px] uppercase tracking-[2px] text-aurora-teal">The GigaMusic library</div><h2 className="mb-0 mt-1 font-display text-2xl font-bold text-[#F3F1FF]">Find music for the moment you're in</h2></div>
          <div className="relative w-full sm:w-[290px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777294]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search songs, artists, Scripture…" className="w-full rounded-full border border-starlight/10 bg-[rgba(7,8,24,.72)] py-2.5 pl-9 pr-4 text-sm text-[#F3F1FF] outline-none placeholder:text-[#625E7C] focus:border-nebula-violet/45" /></div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {genres.map((item) => <button key={item} type="button" onClick={() => setGenre(item)} className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[1px] ${genre === item ? 'border-aurora-teal/40 bg-aurora-teal/10 text-aurora-teal' : 'border-starlight/10 bg-white/[0.02] text-[#8E89AA] hover:border-nebula-violet/35'}`}>{item}</button>)}
        </div>

        {error && <p className="text-center text-sm text-stardust-pink">{error}</p>}
        {songs === null && !error && <p className="text-center font-mono text-sm text-muted">Loading songs…</p>}
        {songs?.length === 0 && <p className="text-center font-mono text-sm text-muted">The music library is being prepared.</p>}
        {songs && songs.length > 0 && filteredSongs.length === 0 && <p className="rounded-2xl border border-starlight/10 p-8 text-center text-sm text-muted">No songs match that search yet. Try another title, artist, Scripture reference or genre.</p>}

        <div className="flex flex-col gap-[18px]">
          {filteredSongs.map((song) => <SongCard key={song.id} song={song} />)}
        </div>
      </section>

      <footer className="mt-12 border-t border-starlight/[0.07] py-8 text-center">
        <p className="m-0 font-display text-sm font-semibold text-[#BDB7DB]">GigaMusic · Music rooted in faith.</p>
        <p className="mb-0 mt-2 text-xs text-[#6F6A8C]">Listen freely. Share hope. Glorify Jesus.</p>
      </footer>
    </>
  )
}
