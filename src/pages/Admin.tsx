import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Trash2, Pencil, Check, X as XIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchUserSongs } from '@/lib/queries'
import { deleteSong, resolveAlbumId, updateSong, replaceSongAudio } from '@/lib/upload'
import { exportEverything, type ExportProgress } from '@/lib/export'
import { formatDuration } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { GENRES } from '@/types'
import type { SongWithAlbum } from '@/types'

const inputClass =
  'rounded-lg border border-starlight/[0.14] bg-white/[0.03] px-2.5 py-2 text-[12.5px] text-starlight outline-none placeholder:text-[#7A7699]'

interface EditDraft {
  title: string
  artist: string
  album: string
  genre: string
  lyrics: string
  newFile: File | null
}

function draftFrom(song: SongWithAlbum): EditDraft {
  return {
    title: song.title,
    artist: song.artist_name,
    album: song.album?.title ?? '',
    genre: song.genre,
    lyrics: song.lyrics ?? '',
    newFile: null,
  }
}

export function Admin() {
  const { user } = useAuth()
  const [songs, setSongs] = useState<SongWithAlbum[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exportState, setExportState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState<ExportProgress | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setError(getErrorMessage(e, 'Could not delete this song.'))
    }
  }

  const startEdit = (song: SongWithAlbum) => {
    setEditingId(song.id)
    setDraft(draftFrom(song))
    setSaveError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(null)
    setSaveError(null)
  }

  const handleSave = async (song: SongWithAlbum) => {
    if (!user || !draft) return
    if (!draft.title.trim()) {
      setSaveError('Title is required.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const album_id = await resolveAlbumId(user.id, draft.album)
      await updateSong(song.id, {
        title: draft.title.trim(),
        artist_name: draft.artist.trim() || 'Unknown Artist',
        album_id,
        genre: draft.genre,
        lyrics: draft.lyrics.trim() || null,
      })
      if (draft.newFile) {
        await replaceSongAudio(song.id, user.id, song.audio_storage_path, draft.newFile)
      }
      setEditingId(null)
      setDraft(null)
      load()
    } catch (e) {
      setSaveError(getErrorMessage(e, 'Could not save changes.'))
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExportState('running')
    setError(null)
    try {
      await exportEverything(setProgress)
      setExportState('done')
    } catch (e) {
      setError(getErrorMessage(e, 'Export failed.'))
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
          {songs?.map((song) => {
            const isEditing = editingId === song.id
            return (
              <div key={song.id} className="rounded-xl border border-starlight/10 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/song/${song.id}`} className="truncate font-display text-sm font-bold text-starlight">
                      {song.title}
                    </Link>
                    <p className="m-0 mt-0.5 truncate text-xs text-muted">
                      {song.artist_name} · {song.album?.title ?? 'Singles'} · {formatDuration(song.duration_seconds)} ·{' '}
                      {song.play_count} plays · {song.download_count} downloads
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => (isEditing ? cancelEdit() : startEdit(song))}
                      title={isEditing ? 'Cancel' : 'Edit'}
                      className="rounded-lg border border-nebula-violet/30 p-2 text-muted hover:bg-nebula-violet/10 hover:text-starlight"
                    >
                      {isEditing ? <XIcon size={15} /> : <Pencil size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(song)}
                      title="Delete"
                      className="rounded-lg border border-stardust-pink/30 p-2 text-stardust-pink hover:bg-stardust-pink/10"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {isEditing && draft && (
                  <div className="mt-3 border-t border-starlight/[0.08] pt-3">
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <input
                        placeholder="Song title"
                        value={draft.title}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        placeholder="Artist"
                        value={draft.artist}
                        onChange={(e) => setDraft({ ...draft, artist: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        placeholder="Album (blank = Singles)"
                        value={draft.album}
                        onChange={(e) => setDraft({ ...draft, album: e.target.value })}
                        className={inputClass}
                      />
                      <select
                        value={draft.genre}
                        onChange={(e) => setDraft({ ...draft, genre: e.target.value })}
                        className={inputClass}
                      >
                        {GENRES.map((g) => (
                          <option key={g} value={g} style={{ backgroundColor: '#14102A', color: '#EDEBFF' }}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      placeholder="Lyrics (optional)"
                      value={draft.lyrics}
                      onChange={(e) => setDraft({ ...draft, lyrics: e.target.value })}
                      rows={2}
                      className={`${inputClass} mb-2 w-full resize-y font-body`}
                    />

                    <div className="mb-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border border-starlight/[0.14] px-3 py-1.5 text-[12.5px] text-muted hover:text-starlight"
                      >
                        Replace audio file…
                      </button>
                      <span className="truncate font-mono text-[11.5px] text-[#7A7699]">
                        {draft.newFile ? draft.newFile.name : song.audio_storage_path.split('/').pop()}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => setDraft({ ...draft, newFile: e.target.files?.[0] ?? null })}
                      />
                    </div>

                    {saveError && <p className="mb-2 text-xs text-stardust-pink">{saveError}</p>}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSave(song)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-nebula-violet to-aurora-teal px-4 py-1.5 font-display text-[13px] font-bold text-[#0A0A18] disabled:opacity-60"
                      >
                        <Check size={14} /> {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="rounded-full border border-starlight/[0.14] px-4 py-1.5 font-display text-[13px] text-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
