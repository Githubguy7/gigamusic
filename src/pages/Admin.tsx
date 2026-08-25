import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchUserSongs } from '@/lib/queries'
import { deleteSong } from '@/lib/upload'
import { exportEverything, type ExportProgress } from '@/lib/export'
import { formatDuration } from '@/lib/format'
import type { SongWithAlbum } from '@/types'

export function Admin() {
  const { user } = useAuth()
  const [songs, setSongs] = useState<SongWithAlbum[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exportState, setExportState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState<ExportProgress | null>(null)

  const load = () => {
    if (!user) return
    fetchUserSongs(user.id)
      .then(setSongs)
      .catch((e: Error) => setError(e.message))
  }

  useEffect(load, [user])

  const handleDelete = async (song: SongWithAlbum) => {
    if (!window.confirm(`Delete "${song.title}"? This cannot be undone.`)) return
    try {
      await deleteSong(song.id, song.audio_storage_path)
      setSongs((ss) => ss?.filter((s) => s.id !== song.id) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this song.')
    }
  }

  const handleExport = async () => {
    setExportState('running')
    setError(null)
    try {
      await exportEverything(setProgress)
      setExportState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.')
      setExportState('error')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-comet-gold/30 bg-comet-gold/5 p-6">
        <h2 className="m-0 font-display text-lg font-bold text-starlight">Backups</h2>
        <p className="mt-1.5 text-sm text-muted">
          Export every song's audio and all metadata (albums, songs, comments) as a zip, right now.
          Nightly automated backups also run server-side — see the README for how they're configured.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportState === 'running'}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-comet-gold to-stardust-pink px-5 py-2.5 font-display text-sm font-bold text-[#0A0A18] disabled:opacity-60"
        >
          <Download size={15} />
          {exportState === 'running' ? 'Exporting…' : 'Export everything'}
        </button>
        {exportState === 'running' && progress && progress.total > 0 && (
          <p className="mt-2 font-mono text-xs text-muted">
            {progress.done} / {progress.total} — {progress.currentTitle}
          </p>
        )}
        {exportState === 'done' && <p className="mt-2 text-sm text-aurora-teal">Export downloaded.</p>}
      </section>

      <section>
        <h2 className="m-0 mb-4 font-display text-lg font-bold text-starlight">Your songs</h2>
        {error && <p className="mb-3 text-sm text-stardust-pink">{error}</p>}
        {songs === null && !error && <p className="font-mono text-sm text-muted">Loading…</p>}
        {songs?.length === 0 && (
          <p className="font-mono text-sm text-muted">
            You haven't uploaded anything yet. <Link to="/upload">Upload a song</Link>.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {songs?.map((song) => (
            <div
              key={song.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-starlight/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="min-w-0">
                <Link to={`/song/${song.id}`} className="truncate font-display text-sm font-bold text-starlight">
                  {song.title}
                </Link>
                <p className="m-0 mt-0.5 truncate text-xs text-muted">
                  {song.artist_name} · {song.album?.title ?? 'Singles'} · {formatDuration(song.duration_seconds)} ·{' '}
                  {song.play_count} plays · {song.download_count} downloads
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(song)}
                title="Delete"
                className="flex-shrink-0 rounded-lg border border-stardust-pink/30 p-2 text-stardust-pink hover:bg-stardust-pink/10"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
