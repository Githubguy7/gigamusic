import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, getPublicAudioUrl } from '@/lib/supabase'
import type { Song } from '@/types'

interface AudioPlayerContextValue {
  playingId: string | null
  currentSong: Song | null
  progress: number
  currentTime: number
  duration: number
  autoplay: boolean
  hasPrevious: boolean
  hasNext: boolean
  toggle: (song: Song) => void
  seek: (seconds: number) => void
  seekToProgress: (progress: number) => void
  setPlaylist: (songs: Song[]) => void
  playPrevious: () => void
  playNext: () => void
  setAutoplay: (enabled: boolean) => void
  isPlaying: (songId: string) => boolean
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null)
const COUNT_AFTER_MS = 3000
const RECOUNT_COOLDOWN_MS = 60_000

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playlistRef = useRef<Song[]>([])
  const currentSongRef = useRef<Song | null>(null)
  const autoplayRef = useRef(true)
  const countTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCountedAtRef = useRef<Map<string, number>>(new Map())
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [currentSong, setCurrentSongState] = useState<Song | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autoplay, setAutoplayState] = useState(true)

  const setCurrentSong = useCallback((song: Song | null) => {
    currentSongRef.current = song
    setCurrentSongState(song)
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

  const startSong = useCallback((song: Song) => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = getPublicAudioUrl(song.audio_storage_path)
    audio.currentTime = 0
    setCurrentTime(0)
    setDuration(song.duration_seconds ?? 0)
    setProgress(0)
    setCurrentSong(song)
    audio.play().catch(() => {})
    setPlayingId(song.id)
    scheduleCount(song.id)
  }, [scheduleCount, setCurrentSong])

  const findCurrentIndex = useCallback(() => {
    const id = currentSongRef.current?.id
    return id ? playlistRef.current.findIndex((song) => song.id === id) : -1
  }, [])

  const playNext = useCallback(() => {
    const list = playlistRef.current
    if (!list.length) return
    const index = findCurrentIndex()
    const nextIndex = index >= 0 && index < list.length - 1 ? index + 1 : 0
    startSong(list[nextIndex])
  }, [findCurrentIndex, startSong])

  const playPrevious = useCallback(() => {
    const list = playlistRef.current
    if (!list.length) return
    const audio = audioRef.current
    if (audio && audio.currentTime > 5) {
      audio.currentTime = 0
      setCurrentTime(0)
      setProgress(0)
      return
    }
    const index = findCurrentIndex()
    const previousIndex = index > 0 ? index - 1 : list.length - 1
    startSong(list[previousIndex])
  }, [findCurrentIndex, startSong])

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
      syncTime()
      if (autoplayRef.current && playlistRef.current.length > 1) playNext()
      else setPlayingId(null)
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
  }, [playNext])

  const toggle = useCallback((song: Song) => {
    const audio = audioRef.current
    if (!audio) return
    if (playingId === song.id) {
      audio.pause()
      setPlayingId(null)
      if (countTimerRef.current) clearTimeout(countTimerRef.current)
      return
    }
    const resumingCurrent = currentSongRef.current?.id === song.id && audio.src
    if (resumingCurrent) {
      audio.play().catch(() => {})
      setPlayingId(song.id)
      scheduleCount(song.id)
    } else startSong(song)
  }, [playingId, scheduleCount, startSong])

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

  const setPlaylist = useCallback((songs: Song[]) => {
    playlistRef.current = songs
  }, [])

  const setAutoplay = useCallback((enabled: boolean) => {
    autoplayRef.current = enabled
    setAutoplayState(enabled)
  }, [])

  const currentIndex = currentSong ? playlistRef.current.findIndex((song) => song.id === currentSong.id) : -1
  const hasPrevious = playlistRef.current.length > 1 && currentIndex !== -1
  const hasNext = playlistRef.current.length > 1 && currentIndex !== -1
  const isPlaying = useCallback((songId: string) => playingId === songId, [playingId])

  const value = useMemo(() => ({
    playingId, currentSong, progress, currentTime, duration, autoplay, hasPrevious, hasNext,
    toggle, seek, seekToProgress, setPlaylist, playPrevious, playNext, setAutoplay, isPlaying,
  }), [playingId, currentSong, progress, currentTime, duration, autoplay, hasPrevious, hasNext, toggle, seek, seekToProgress, setPlaylist, playPrevious, playNext, setAutoplay, isPlaying])

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('useAudioPlayer must be used within an AudioPlayerProvider')
  return ctx
}
