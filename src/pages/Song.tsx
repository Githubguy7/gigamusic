import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SongCard } from '@/components/SongCard'
import { fetchSong } from '@/lib/queries'
import type { SongWithAlbum } from '@/types'

const SITE_NAME = 'GigaMusic'
const SITE_URL = 'https://gigamusic.org'

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value))
}

function upsertCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = url
}

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

  useEffect(() => {
    if (!song) return

    const canonical = `${SITE_URL}/song/${song.id}`
    const title = `${song.title} by ${song.artist_name} | ${SITE_NAME}`
    const description = (song.description || song.song_meaning || `Listen to ${song.title} by ${song.artist_name} on GigaMusic — Christian music for worship, reflection and hope.`).replace(/\s+/g, ' ').trim().slice(0, 160)
    const image = song.artwork_url || undefined

    document.title = title
    upsertCanonical(canonical)
    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'music.song' })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    if (image) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image })
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image })
    }

    const jsonLdId = 'gigamusic-song-jsonld'
    document.getElementById(jsonLdId)?.remove()
    const script = document.createElement('script')
    script.id = jsonLdId
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: song.title,
      byArtist: { '@type': 'MusicGroup', name: song.artist_name },
      url: canonical,
      genre: song.genre || undefined,
      duration: song.duration_seconds ? `PT${Math.round(song.duration_seconds)}S` : undefined,
      inAlbum: song.album?.title ? { '@type': 'MusicAlbum', name: song.album.title } : undefined,
      image,
      description,
    })
    document.head.appendChild(script)

    return () => {
      document.getElementById(jsonLdId)?.remove()
      document.title = 'GigaMusic — Christian Music for Worship, Reflection & Hope'
      upsertCanonical(SITE_URL)
    }
  }, [song])

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
