import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, getPublicAudioUrl } from '@/lib/supabase'
import type { Song } from '@/types'

interface AudioPlayerContextValue {
  playingId: string | null
  playbackError: string | null
  retryPlayback: () => void
  currentSong: Song | null
  progress: number
  currentTime: number
  duration: number
  autoplay: boolean
  volume: number
  hasPrevious: boolean
  hasNext: boolean
  toggle: (song: Song) => void
  seek: (seconds: number) => void
  seekToProgress: (progress: number) => void
  setPlaylist: (songs: Song[]) => void
  playPrevious: () => void
  playNext: () => void
  setAutoplay: (enabled: boolean) => void
  setVolume: (volume: number) => void
  isPlaying: (songId: string) => boolean
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null)
const COUNT_AFTER_MS = 3000
const RECOUNT_COOLDOWN_MS = 60_000
const STALL_AFTER_MS = 12_000

type PlaybackTrigger = 'selection' | 'ended' | 'resume' | 'foreground'

function logPlayback(audio: HTMLAudioElement, songId: string | undefined, event: string, errorName?: string) {
  if (!errorName && new URLSearchParams(window.location.search).get('audioDebug') !== '1') return
  const details = {
    songId, event, errorName, visibility: document.visibilityState,
    paused: audio.paused, ended: audio.ended, readyState: audio.readyState,
    networkState: audio.networkState, mediaErrorCode: audio.error?.code,
    position: Math.floor(audio.currentTime),
  }
  if (errorName) console.warn('[GigaMusic] Audio', details)
  else console.info('[GigaMusic] Audio', details)
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playlistRef = useRef<Song[]>([])
  const currentSongRef = useRef<Song | null>(null)
  const autoplayRef = useRef(true)
  const playNextRef = useRef<(trigger: 'ended' | 'foreground') => void>(() => {})
  const pendingBackgroundSongRef = useRef<Song | null>(null)
  const playRequestRef = useRef(0)
  const wantsPlaybackRef = useRef(false)
  const needsReloadRef = useRef(false)
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stallSampleRef = useRef<{ time: number; position: number } | null>(null)
  const countTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCountedAtRef = useRef<Map<string, number>>(new Map())
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const [currentSong, setCurrentSongState] = useState<Song | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autoplay, setAutoplayState] = useState(true)
  const [volume, setVolumeState] = useState(0.7)

  const setCurrentSong = useCallback((song: Song | null) => {
    currentSongRef.current = song
    setCurrentSongState(song)
  }, [])

  const clearCount = useCallback(() => {
    if (countTimerRef.current) clearTimeout(countTimerRef.current)
    countTimerRef.current = null
  }, [])

  const scheduleCount = useCallback((songId: string) => {
    clearCount()
    const lastCountedAt = lastCountedAtRef.current.get(songId) ?? 0
    if (Date.now() - lastCountedAt < RECOUNT_COOLDOWN_MS) return
    countTimerRef.current = setTimeout(async () => {
      const audio = audioRef.current
      if (!audio || audio.paused || audio.ended || audio.error || currentSongRef.current?.id !== songId) return
      lastCountedAtRef.current.set(songId, Date.now())
      await supabase.rpc('increment_play_count', { song_id: songId })
    }, COUNT_AFTER_MS)
  }, [clearCount])

  const clearStallWatch = useCallback(() => {
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
    stallTimerRef.current = null
    stallSampleRef.current = null
  }, [])

  const checkStall = useCallback((audio: HTMLAudioElement) => {
    const sample = stallSampleRef.current
    if (!sample || audio.ended || audio.error || !wantsPlaybackRef.current || needsReloadRef.current) return
    if (audio.currentTime !== sample.position) {
      clearStallWatch()
      return
    }
    if (Date.now() - sample.time < STALL_AFTER_MS) return
    ++playRequestRef.current
    needsReloadRef.current = true
    pendingBackgroundSongRef.current = null
    clearStallWatch()
    clearCount()
    logPlayback(audio, currentSongRef.current?.id, 'no progress', 'StallTimeout')
    setPlayingId(null)
    setPlaybackError('Playback appears stuck. Tap Play or Resume to continue.')
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
  }, [clearCount, clearStallWatch])

  const watchForStall = useCallback((audio: HTMLAudioElement) => {
    if (!wantsPlaybackRef.current || needsReloadRef.current || stallSampleRef.current) return
    stallSampleRef.current = { time: Date.now(), position: audio.currentTime }
    stallTimerRef.current = setTimeout(() => checkStall(audio), STALL_AFTER_MS)
  }, [checkStall])

  const requestPlayback = useCallback((audio: HTMLAudioElement, song: Song, trigger: PlaybackTrigger) => {
    const request = ++playRequestRef.current
    const startedHidden = document.hidden
    wantsPlaybackRef.current = true
    needsReloadRef.current = false
    pendingBackgroundSongRef.current = null
    clearStallWatch()
    setPlaybackError(null)
    logPlayback(audio, song.id, `play requested: ${trigger}`)
    audio.play().then(() => {
      if (request !== playRequestRef.current) return
      logPlayback(audio, song.id, `play resolved: ${trigger}`)
      if (audio.paused || audio.ended || audio.error) return
      setPlayingId(song.id)
    }).catch((error: unknown) => {
      if (request !== playRequestRef.current) return
      const name = error instanceof Error ? error.name : 'Unknown'
      clearStallWatch()
      logPlayback(audio, song.id, `play rejected: ${trigger}`, name)
      needsReloadRef.current = Boolean(audio.error) || name === 'NotSupportedError'
        || (trigger === 'resume' && name !== 'NotAllowedError')
      if (startedHidden && document.hidden && trigger === 'ended' && autoplayRef.current && !needsReloadRef.current) {
        pendingBackgroundSongRef.current = song
      }
      setPlayingId(null)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
      setPlaybackError(name === 'NotAllowedError'
        ? 'Playback was blocked by the browser. Tap Resume to continue.'
        : 'Playback was interrupted. Tap Resume or choose another song.')
    })
    watchForStall(audio)
  }, [clearStallWatch, watchForStall])

  const startSong = useCallback((song: Song, trigger: PlaybackTrigger = 'selection') => {
    const audio = audioRef.current
    if (!audio) return
    clearCount()
    setPlayingId(null)
    // Assigning src starts resource selection on the existing media element.
    audio.src = getPublicAudioUrl(song.audio_storage_path)
    setCurrentTime(0)
    setDuration(song.duration_seconds ?? 0)
    setProgress(0)
    setCurrentSong(song)
    requestPlayback(audio, song, trigger)
  }, [clearCount, requestPlayback, setCurrentSong])

  const retryPlayback = useCallback(() => {
    const audio = audioRef.current
    const song = currentSongRef.current
    if (!audio || !song) return
    checkStall(audio)
    if (!audio.src || audio.ended) {
      startSong(song, 'resume')
      return
    }
    if (needsReloadRef.current || audio.error) {
      const position = audio.currentTime
      logPlayback(audio, song.id, 'reload current track')
      audio.load()
      // Set the initial seek before play() so it stays in the same tap.
      if (position > 0) audio.currentTime = position
    }
    requestPlayback(audio, song, 'resume')
  }, [checkStall, requestPlayback, startSong])

  const cancelPlayback = useCallback(() => {
    ++playRequestRef.current
    wantsPlaybackRef.current = false
    pendingBackgroundSongRef.current = null
    clearStallWatch()
    clearCount()
  }, [clearCount, clearStallWatch])

  const pausePlayback = useCallback(() => {
    cancelPlayback()
    audioRef.current?.pause()
    setPlayingId(null)
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
  }, [cancelPlayback])

  useEffect(() => {
    const retryWhenVisible = () => {
      if (document.hidden) return
      const audio = audioRef.current
      if (!audio) return
      logPlayback(audio, currentSongRef.current?.id, 'foreground')
      if (!wantsPlaybackRef.current) return
      if (audio.ended && autoplayRef.current && playlistRef.current.length > 1) {
        playNextRef.current('foreground')
        return
      }
      const pending = pendingBackgroundSongRef.current
      if (pending && currentSongRef.current?.id === pending.id && !audio.error) {
        requestPlayback(audio, pending, 'foreground')
        return
      }
      checkStall(audio)
      if (!audio.paused && !audio.ended) watchForStall(audio)
    }
    document.addEventListener('visibilitychange', retryWhenVisible)
    window.addEventListener('pageshow', retryWhenVisible)
    return () => {
      document.removeEventListener('visibilitychange', retryWhenVisible)
      window.removeEventListener('pageshow', retryWhenVisible)
    }
  }, [checkStall, requestPlayback, watchForStall])

  const findCurrentIndex = useCallback(() => {
    const id = currentSongRef.current?.id
    return id ? playlistRef.current.findIndex((song) => song.id === id) : -1
  }, [])

  const advanceTrack = useCallback((trigger: PlaybackTrigger) => {
    const list = playlistRef.current
    if (!list.length) return
    const index = findCurrentIndex()
    const nextIndex = index >= 0 && index < list.length - 1 ? index + 1 : 0
    startSong(list[nextIndex], trigger)
  }, [findCurrentIndex, startSong])

  const playNext = useCallback(() => advanceTrack('selection'), [advanceTrack])
  useEffect(() => { playNextRef.current = advanceTrack }, [advanceTrack])

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
    // Keep the media element attached to the document. Android/Chrome is more
    // likely to preserve an attached media session when the screen locks than
    // an Audio() object that only exists in JavaScript memory.
    const audio = document.createElement('audio')
    audio.preload = 'auto'
    audio.volume = 0.7
    audio.setAttribute('playsinline', '')
    audio.setAttribute('data-gigamusic-player', 'true')
    audio.style.display = 'none'
    document.body.appendChild(audio)
    audioRef.current = audio

    const onBuffering = (event: Event) => {
      if (audio.paused || audio.ended) return
      logPlayback(audio, currentSongRef.current?.id, event.type)
      watchForStall(audio)
    }
    const onPlaying = () => {
      const song = currentSongRef.current
      if (!song || audio.paused || audio.ended || audio.error || !wantsPlaybackRef.current) return
      needsReloadRef.current = false
      pendingBackgroundSongRef.current = null
      setPlaybackError(null)
      setPlayingId(song.id)
      scheduleCount(song.id)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
      logPlayback(audio, song.id, 'playing')
    }

    const syncTime = () => {
      if (stallSampleRef.current && audio.currentTime !== stallSampleRef.current.position) clearStallWatch()
      const nextDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
      const nextTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
      setDuration(nextDuration)
      setCurrentTime(nextTime)
      setProgress(nextDuration > 0 ? nextTime / nextDuration : 0)
    }
    const onEnded = () => {
      if (!audio.ended) return
      logPlayback(audio, currentSongRef.current?.id, 'ended')
      clearStallWatch()
      syncTime()
      if (wantsPlaybackRef.current && autoplayRef.current && playlistRef.current.length > 1) {
        playNextRef.current('ended')
      } else {
        setPlayingId(null)
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
      }
    }
    const onPause = () => {
      if (!audio.paused || audio.ended) return
      setPlayingId(null)
      clearCount()
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
      logPlayback(audio, currentSongRef.current?.id, 'paused')
    }
    const onError = () => {
      if (!audio.error) return
      clearCount()
      clearStallWatch()
      needsReloadRef.current = true
      pendingBackgroundSongRef.current = null
      setPlayingId(null)
      setPlaybackError('This song could not be loaded. Tap Play or Resume to try again.')
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
      logPlayback(audio, currentSongRef.current?.id, 'media error', 'MediaError')
    }

    audio.addEventListener('waiting', onBuffering)
    audio.addEventListener('stalled', onBuffering)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('loadedmetadata', syncTime)
    audio.addEventListener('durationchange', syncTime)
    audio.addEventListener('timeupdate', syncTime)
    audio.addEventListener('seeked', syncTime)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    return () => {
      cancelPlayback()
      audio.removeEventListener('waiting', onBuffering)
      audio.removeEventListener('stalled', onBuffering)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('loadedmetadata', syncTime)
      audio.removeEventListener('durationchange', syncTime)
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('seeked', syncTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audio.remove()
      audioRef.current = null
    }
  }, [cancelPlayback, clearCount, clearStallWatch, scheduleCount, watchForStall])

  const toggle = useCallback((song: Song) => {
    const audio = audioRef.current
    if (!audio) return
    const isCurrent = currentSongRef.current?.id === song.id
    if (isCurrent) {
      checkStall(audio)
      if (!audio.paused && !audio.ended && !audio.error && !needsReloadRef.current && playingId === song.id) {
        pausePlayback()
      } else {
        retryPlayback()
      }
      return
    }
    startSong(song)
  }, [checkStall, pausePlayback, playingId, retryPlayback, startSong])

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

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const audio = audioRef.current
    if (!audio) return
    if (currentSong && typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist_name || 'GigaMusic',
        album: 'GigaMusic',
      })
    }
    const updatePosition = () => {
      if (!navigator.mediaSession.setPositionState) return
      const duration = audio.duration
      if (!Number.isFinite(duration) || duration <= 0) return
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: audio.playbackRate,
          position: Math.max(0, Math.min(duration, audio.currentTime)),
        })
      } catch { /* Browser does not support this state */ }
    }
    audio.addEventListener('loadedmetadata', updatePosition)
    audio.addEventListener('seeked', updatePosition)
    audio.addEventListener('timeupdate', updatePosition)
    updatePosition()
    const safePlay = () => retryPlayback()
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [
      ['play', safePlay], ['pause', pausePlayback],
      ['previoustrack', playPrevious], ['nexttrack', playNext],
      ['seekbackward', (d) => seek(audio.currentTime - (d.seekOffset || 10))],
      ['seekforward', (d) => seek(audio.currentTime + (d.seekOffset || 10))],
      ['seekto', (d) => { if (d.seekTime != null) seek(d.seekTime) }],
    ]
    for (const [action, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(action, handler) } catch { /* unsupported action */ }
    }
    return () => {
      audio.removeEventListener('loadedmetadata', updatePosition)
      audio.removeEventListener('seeked', updatePosition)
      audio.removeEventListener('timeupdate', updatePosition)
      for (const [action] of handlers) {
        try { navigator.mediaSession.setActionHandler(action, null) } catch { /* unsupported action */ }
      }
    }
  }, [currentSong, pausePlayback, playNext, playPrevious, retryPlayback, seek])

  const setAutoplay = useCallback((enabled: boolean) => {
    autoplayRef.current = enabled
    if (!enabled) pendingBackgroundSongRef.current = null
    setAutoplayState(enabled)
  }, [])

  const setVolume = useCallback((nextVolume: number) => {
    const clamped = Math.max(0, Math.min(1, nextVolume))
    if (audioRef.current) audioRef.current.volume = clamped
    setVolumeState(clamped)
  }, [])

  const currentIndex = currentSong ? playlistRef.current.findIndex((song) => song.id === currentSong.id) : -1
  const hasPrevious = playlistRef.current.length > 1 && currentIndex !== -1
  const hasNext = playlistRef.current.length > 1 && currentIndex !== -1
  const isPlaying = useCallback((songId: string) => playingId === songId, [playingId])

  const value = useMemo(() => ({
    playingId, playbackError, retryPlayback, currentSong, progress, currentTime, duration, autoplay, volume, hasPrevious, hasNext,
    toggle, seek, seekToProgress, setPlaylist, playPrevious, playNext, setAutoplay, setVolume, isPlaying,
  }), [playingId, playbackError, retryPlayback, currentSong, progress, currentTime, duration, autoplay, volume, hasPrevious, hasNext, toggle, seek, seekToProgress, setPlaylist, playPrevious, playNext, setAutoplay, setVolume, isPlaying])

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('useAudioPlayer must be used within an AudioPlayerProvider')
  return ctx
}
