import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, SONGS_BUCKET } from '@/lib/supabase'
import { validateAudioFile, readAudioDuration, resolveAlbumId, uploadSongFile } from '@/lib/upload'
import { getErrorMessage } from '@/lib/errors'
import { GENRES } from '@/types'

interface Row {
  id: string
  file: File
  title: string
  artist: string
  album: string
  genre: string
  lyrics: string
}

interface BatchResult {
  success: number
  skipped: number
  failed: number
  total: number
}

const inputClass =
  'rounded-lg border border-starlight/[0.14] bg-white/[0.03] px-2.5 py-2 text-[12.5px] text-starlight outline-none placeholder:text-[#7A7699]'

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()
const rowArtist = (row: Row) => row.artist.trim() || 'Unknown Artist'
const duplicateKey = (title: string, artist: string) => `${normalize(title)}::${normalize(artist)}`

export function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [rows, setRows] = useState<Row[]>([])
  const [publishing, setPublishing] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<BatchResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    setError(null)
    setResult(null)
    const files = Array.from(fileList)
    for (const f of files) {
      const invalid = validateAudioFile(f)
      if (invalid) {
        setError(invalid)
        return
      }
    }
    const newRows: Row[] = files.map((f, i) => ({
      id: `row-${Date.now()}-${i}`,
      file: f,
      title: f.name.replace(/\.[^/.]+$/, ''),
      artist: '',
      album: '',
      genre: GENRES[0],
      lyrics: '',
    }))
    setRows((rs) => (mode === 'single' ? newRows.slice(0, 1) : [...rs, ...newRows]))
  }

  const updateRow = (id: string, field: keyof Omit<Row, 'id' | 'file'>, value: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
    setRowErrors((current) => {
      if (!current[id]) return current
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const removeRow = (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id))
    setRowErrors((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const submit = async () => {
    if (!user) return
    const valid = rows.filter((r) => r.title.trim())
    if (valid.length === 0) return

    setPublishing(true)
    setError(null)
    setResult(null)
    setRowErrors({})
    setProgress({ done: 0, total: valid.length })

    let success = 0
    let skipped = 0
    let failed = 0
    let attempted = 0

    try {
      const { data: existingSongs, error: existingError } = await supabase
        .from('songs')
        .select('title, artist_name')
        .eq('user_id', user.id)

      if (existingError) throw existingError

      const seen = new Set(
        (existingSongs ?? []).map((song) => duplicateKey(song.title ?? '', song.artist_name ?? 'Unknown Artist')),
      )

      for (const row of valid) {
        let uploadedPath: string | null = null
        const key = duplicateKey(row.title, rowArtist(row))

        try {
          if (seen.has(key)) {
            skipped += 1
            setRows((rs) => rs.filter((r) => r.id !== row.id))
            continue
          }

          const album_id = await resolveAlbumId(user.id, row.album)
          const [audio_storage_path, duration_seconds] = await Promise.all([
            uploadSongFile(user.id, row.file),
            readAudioDuration(row.file),
          ])
          uploadedPath = audio_storage_path

          const { error: insertError } = await supabase.from('songs').insert({
            user_id: user.id,
            album_id,
            title: row.title.trim(),
            artist_name: rowArtist(row),
            genre: row.genre,
            lyrics: row.lyrics.trim() || null,
            audio_storage_path,
            duration_seconds,
          })

          if (insertError) {
            await supabase.storage.from(SONGS_BUCKET).remove([audio_storage_path])
            uploadedPath = null
            throw insertError
          }

          seen.add(key)
          success += 1
          setRows((rs) => rs.filter((r) => r.id !== row.id))
          setRowErrors((current) => {
            const next = { ...current }
            delete next[row.id]
            return next
          })
        } catch (e) {
          failed += 1
          if (uploadedPath) {
            await supabase.storage.from(SONGS_BUCKET).remove([uploadedPath]).catch(() => undefined)
          }
          const message = getErrorMessage(e, `Could not publish ${row.file.name}.`)
          setRowErrors((current) => ({ ...current, [row.id]: message }))
        } finally {
          attempted += 1
          setProgress({ done: attempted, total: valid.length })
        }
      }

      setResult({ success, skipped, failed, total: valid.length })
      if (failed === 0 && skipped === 0) navigate('/')
    } catch (e) {
      setError(getErrorMessage(e, 'Something unexpected interrupted the bulk upload.'))
    } finally {
      setPublishing(false)
      setProgress(null)
    }
  }

  return (
    <div className="mx-auto max-w-[640px] rounded-[20px] border border-nebula-violet/30 bg-gradient-to-b from-[#14102A] to-[#0A0A18] p-[26px] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
      <h1 className="m-0 mb-[18px] font-display text-xl font-bold text-[#F3F1FF]">
        Upload {mode === 'bulk' ? 'songs' : 'a song'}
      </h1>

      <div className="mb-[18px] flex gap-2">
        {(['single', 'bulk'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m)
              setRows([])
              setRowErrors({})
              setResult(null)
              setError(null)
            }}
            className={`rounded-full border px-4 py-2 font-body text-[13px] capitalize ${
              mode === m
                ? 'border-aurora-teal/50 bg-aurora-teal/10 text-aurora-teal'
                : 'border-starlight/[0.14] text-muted'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="mb-[18px] cursor-pointer rounded-2xl border-[1.5px] border-dashed border-nebula-violet/45 bg-nebula-violet/5 px-4 py-[26px] text-center"
      >
        <UploadIcon size={22} className="mx-auto mb-1.5 text-nebula-violet" />
        <p className="m-0 text-[13.5px] text-[#C9C2F0]">
          Drop {mode === 'bulk' ? 'audio files' : 'an audio file'} here, or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple={mode === 'bulk'}
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="mb-4 rounded-lg border border-stardust-pink/25 bg-stardust-pink/10 p-3 text-sm text-stardust-pink">{error}</p>}

      {result && (result.failed > 0 || result.skipped > 0) && (
        <div className="mb-4 rounded-lg border border-starlight/10 bg-white/[0.03] p-3 text-sm text-starlight">
          <strong>{result.success} published</strong>
          {result.skipped > 0 && <span> · <span className="text-aurora-teal">{result.skipped} duplicate{result.skipped === 1 ? '' : 's'} skipped</span></span>}
          {result.failed > 0 && <span> · <span className="text-stardust-pink">{result.failed} failed</span></span>}.
          {result.failed > 0 && ' The failed songs are still below with their errors. Fix anything needed, then choose Retry failed.'}
          {result.failed === 0 && result.skipped > 0 && ' Existing songs were not uploaded again.'}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mb-5 flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border p-3.5 ${rowErrors[r.id] ? 'border-stardust-pink/40 bg-stardust-pink/[0.04]' : 'border-starlight/10 bg-white/[0.02]'}`}
            >
              <div className="mb-2 flex justify-between">
                <span className="font-mono text-[11.5px] text-[#7A7699]">{r.file.name}</span>
                {mode === 'bulk' && (
                  <button type="button" onClick={() => removeRow(r.id)} className="text-[#7A7699]">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <input
                  placeholder="Song title"
                  value={r.title}
                  onChange={(e) => updateRow(r.id, 'title', e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="Artist"
                  value={r.artist}
                  onChange={(e) => updateRow(r.id, 'artist', e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="Album (blank = Singles)"
                  value={r.album}
                  onChange={(e) => updateRow(r.id, 'album', e.target.value)}
                  className={inputClass}
                />
                <select
                  value={r.genre}
                  onChange={(e) => updateRow(r.id, 'genre', e.target.value)}
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
                value={r.lyrics}
                onChange={(e) => updateRow(r.id, 'lyrics', e.target.value)}
                rows={2}
                className={`${inputClass} w-full resize-y font-body`}
              />
              {rowErrors[r.id] && (
                <p className="m-0 mt-2 rounded-md bg-stardust-pink/10 px-2.5 py-2 text-xs text-stardust-pink">
                  Failed: {rowErrors[r.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={rows.length === 0 || publishing}
        className={`w-full rounded-xl py-3 font-display text-[14.5px] font-bold ${
          rows.length && !publishing
            ? 'bg-gradient-to-br from-nebula-violet to-aurora-teal text-[#0A0A18]'
            : 'cursor-not-allowed bg-white/[0.06] text-[#5C5980]'
        }`}
      >
        {publishing
          ? `Processing ${progress ? `${Math.min(progress.done + 1, progress.total)} of ${progress.total}` : '…'}`
          : result?.failed
            ? `Retry failed (${rows.length})`
            : `Publish ${rows.length > 1 ? `${rows.length} songs` : 'song'}`}
      </button>
      {publishing && progress && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-nebula-violet to-aurora-teal transition-[width]"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
          <p className="m-0 mt-1.5 text-center font-mono text-[11.5px] text-muted">
            {progress.done} / {progress.total} processed
          </p>
        </div>
      )}
    </div>
  )
}
