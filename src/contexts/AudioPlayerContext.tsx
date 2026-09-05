import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, getPublicAudioUrl } from '@/lib/supabase'
import type { Song } from '@/types'

interface AudioPlayerContextValue {
  playingId: string | null
  currentSong: Song | null
  progress: number // 0-1 for the current track
  currentTime: number
  duration: number
  toggle: (song: Song) => void
  seek: (seconds: number) => void
  seekToProgress: (progress: number) => void
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
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const countTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCountedAtRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    const syncTime = () => {
      const nextDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
      const nextTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
      setDuration(nextDuration)
      setCurrentTime(nextTime)
      setProgress(nextDuration > 0 ? nextTime / nextDuration : 0)
    }

    const onEnded = () => {
      setPlayingId(null)
      syncTime()
    }

    audio.addEventListener('loadedmetadata', syncTime)
    audio.addEventListener('durationchange', syncTime)
    audio.addEventListener('timeupdate', syncTime)
    audio.addEventListener('seeked', syncTime)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', syncTime)
      audio.removeEventListener('durationchange', syncTime)
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('seeked', syncTime)
      audio.removeEventListener('ended', onEnded)
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

      const resumingCurrent = currentSong?.id === song.id && audio.src
      if (!resumingCurrent) {
        audio.src = getPublicAudioUrl(song.audio_storage_path)
        audio.currentTime = 0
        setCurrentTime(0)
        setDuration(song.duration_seconds ?? 0)
        setProgress(0)
      }

      setCurrentSong(song)
      audio.play().catch(() => {})
      setPlayingId(song.id)
      scheduleCount(song.id)
    },
    [playingId, currentSong, scheduleCount],
  )

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    const max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration
    if (!max) return
    const next = Math.max(0, Math.min(max, seconds))
    audio.currentTime = next
    setCurrentTime(next)
    setProgress(next / max)
  }, [duration])

  const seekToProgress = useCallback((nextProgress: number) => {
    const audio = audioRef.current
    if (!audio) return
    const max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration
    if (!max) return
    const clamped = Math.max(0, Math.min(1, nextProgress))
    const next = clamped * max
    audio.currentTime = next
    setCurrentTime(next)
    setProgress(clamped)
  }, [duration])

  const isPlaying = useCallback((songId: string) => playingId === songId, [playingId])

  const value = useMemo(
    () => ({ playingId, currentSong, progress, currentTime, duration, toggle, seek, seekToProgress, isPlaying }),
    [playingId, currentSong, progress, currentTime, duration, toggle, seek, seekToProgress, isPlaying],
  )

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('useAudioPlayer must be used within an AudioPlayerProvider')
  return ctx
}
