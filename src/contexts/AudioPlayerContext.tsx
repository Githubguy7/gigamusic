import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, getPublicAudioUrl } from '@/lib/supabase'
import type { Song } from '@/types'

interface AudioPlayerContextValue {
  playingId: string | null
  progress: number // 0-1 for the currently playing track
  toggle: (song: Song) => void
  isPlaying: (songId: string) => boolean
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null)

// A play only counts once it has held playback for this long, so scrubbing
// or an accidental tap doesn't inflate play_count.
const COUNT_AFTER_MS = 3000
// Once a track has been counted, don't count it again for this long even if
// the listener pauses and resumes.
const RECOUNT_COOLDOWN_MS = 60_000

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const countTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCountedAtRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const onEnded = () => setPlayingId(null)
    const onTimeUpdate = () => {
      if (audio.duration > 0) setProgress(audio.currentTime / audio.duration)
    }
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)

    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.pause()
    }
  }, [])

  const scheduleCount = useCallback((songId: string) => {
    if (countTimerRef.current) clearTimeout(countTimerRef.current)

    const lastCountedAt = lastCountedAtRef.current.get(songId) ?? 0
    if (Date.now() - lastCountedAt < RECOUNT_COOLDOWN_MS) return

    countTimerRef.current = setTimeout(async () => {
      const audio = audioRef.current
      if (!audio || audio.paused) return
      lastCountedAtRef.current.set(songId, Date.now())
      await supabase.rpc('increment_play_count', { song_id: songId })
    }, COUNT_AFTER_MS)
  }, [])

  const toggle = useCallback(
    (song: Song) => {
      const audio = audioRef.current
      if (!audio) return

      if (playingId === song.id) {
        audio.pause()
        setPlayingId(null)
        if (countTimerRef.current) clearTimeout(countTimerRef.current)
        return
      }

      audio.src = getPublicAudioUrl(song.audio_storage_path)
      audio.currentTime = 0
      audio.play().catch(() => {})
      setPlayingId(song.id)
      setProgress(0)
      scheduleCount(song.id)
    },
    [playingId, scheduleCount],
  )

  const isPlaying = useCallback((songId: string) => playingId === songId, [playingId])

  const value = useMemo(
    () => ({ playingId, progress, toggle, isPlaying }),
    [playingId, progress, toggle, isPlaying],
  )

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('useAudioPlayer must be used within an AudioPlayerProvider')
  return ctx
}
