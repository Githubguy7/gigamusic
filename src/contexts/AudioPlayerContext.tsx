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

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playlistRef = useRef<Song[]>([])
  const currentSongRef = useRef<Song | null>(null)
  const autoplayRef = useRef(true)
  const playNextRef = useRef<() => void>(() => {})
  const pendingBackgroundSongRef = useRef<Song | null>(null)
  const playRequestRef = useRef(0)
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stalledAtRef = useRef<number | null>(null)
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
    const request = ++playRequestRef.current
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
    stallTimerRef.current = null
    stalledAtRef.current = null
    pendingBackgroundSongRef.current = null
    setPlaybackError(null)
    setPlayingId(null)
    // Assigning src loads the resource; an explicit load() can interrupt
    // Android Chrome's background media session at a track boundary.
    audio.src = getPublicAudioUrl(song.audio_storage_path)
    setCurrentTime(0)
    setDuration(song.duration_seconds ?? 0)
    setProgress(0)
    setCurrentSong(song)
    audio.play().then(() => {
      if (request !== playRequestRef.current) return
      pendingBackgroundSongRef.current = null
      setPlayingId(song.id)
      scheduleCount(song.id)
    }).catch((error: unknown) => {
      if (request !== playRequestRef.current) return
      const name = error instanceof Error ? error.name : 'Unknown'
      console.warn('[GigaMusic] Track playback failed', { songId: song.id, hidden: document.hidden, name })
      pendingBackgroundSongRef.current = document.hidden ? song : null
      setPlayingId(null)
      setPlaybackError(name === 'NotAllowedError'
        ? 'Playback was blocked by the browser. Tap Resume to continue.'
        : 'Playback was interrupted. Tap Resume or choose another song.')
    })
  }, [scheduleCount, setCurrentSong])

  // A user-initiated recovery action is essential when Chrome rejects
  // background autoplay. Never loop indefinitely on a rejected play().
  const retryPlayback = useCallback(() => {
    const audio = audioRef.current
    const song = currentSongRef.current
    if (!audio || !song) return
    if (!audio.src || audio.error) {
      startSong(song)
      return
    }
    const request = ++playRequestRef.current
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
    stallTimerRef.current = null
    stalledAtRef.current = null
    pendingBackgroundSongRef.current = null
    setPlaybackError(null)
    audio.play().then(() => {
      if (request !== playRequestRef.current) return
      setPlayingId(song.id)
      scheduleCount(song.id)
    }).catch((error: unknown) => {
      if (request !== playRequestRef.current) return
      console.warn('[GigaMusic] Manual resume failed', {
        songId: song.id, name: error instanceof Error ? error.name : 'Unknown',
      })
      setPlayingId(null)
      setPlaybackError('Playback could not resume. Try Next or reopen the page.')
    })
  }, [scheduleCount, startSong])

  // Recover a blocked background transition after Chrome becomes visible.
  // This does not claim to bypass Android autoplay or power restrictions.
  useEffect(() => {
    const retryWhenVisible = () => {
      if (document.hidden) return
      const audio = audioRef.current
      if (!audio) return
      if (audio.ended && autoplayRef.current && playlistRef.current.length > 1) {
        playNextRef.current()
        return
      }
      // Android can suspend a media stream without dispatching an error or
      // rejecting play(). Offer a manual recovery after a prolonged stall.
      if (stalledAtRef.current !== null && Date.now() - stalledAtRef.current >= 12_000 && !audio.paused && !audio.ended) {
        setPlaybackError('Playback appears stuck. Tap Resume or Next to continue.')
      }
      const pending = pendingBackgroundSongRef.current
      if (!pending || currentSongRef.current?.id !== pending.id) return
      pendingBackgroundSongRef.current = null
      audio.play().then(() => {
        setPlayingId(pending.id)
        scheduleCount(pending.id)
      }).catch((error: unknown) => {
        console.warn('[GigaMusic] Foreground playback retry failed', {
          songId: pending.id, name: error instanceof Error ? error.name : 'Unknown',
        })
        setPlaybackError('Playback was interrupted. Tap Resume to continue.')
      })
    }
    document.addEventListener('visibilitychange', retryWhenVisible)
    window.addEventListener('pageshow', retryWhenVisible)
    return () => {
      document.removeEventListener('visibilitychange', retryWhenVisible)
      window.removeEventListener('pageshow', retryWhenVisible)
    }
  }, [scheduleCount])

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

  useEffect(() => { playNextRef.current = playNext }, [playNext])

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

    const clearStall = () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
      stallTimerRef.current = null
      stalledAtRef.current = null
    }
    const onBuffering = (event: Event) => {
      if (audio.paused || audio.ended) return
      if (stalledAtRef.current === null) stalledAtRef.current = Date.now()
      console.warn('[GigaMusic] Audio buffering', {
        event: event.type, songId: currentSongRef.current?.id,
        hidden: document.hidden, readyState: audio.readyState, networkState: audio.networkState,
      })
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
      stallTimerRef.current = setTimeout(() => {
        if (audio.paused || audio.ended || audio.readyState >= 3) return
        setPlaybackError('Playback appears stuck. Tap Resume or Next to continue.')
      }, 12_000)
    }
    const onPlaying = () => {
      clearStall()
      setPlaybackError(null)
    }

    const syncTime = () => {
      const nextDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0
      const nextTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
      setDuration(nextDuration)
      setCurrentTime(nextTime)
      setProgress(nextDuration > 0 ? nextTime / nextDuration : 0)
    }
    const onEnded = () => {
      syncTime()
      if (autoplayRef.current && playlistRef.current.length > 1) playNextRef.current()
      else setPlayingId(null)
    }
    const onPlay = () => {
      setPlayingId(currentSongRef.current?.id ?? null)
      setPlaybackError(null)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
    }
    const onPause = () => {
      clearStall()
      if (!audio.ended) setPlayingId(null)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
    }
    const onError = () => {
      setPlayingId(null)
      setPlaybackError('This song could not be loaded. Tap Resume or skip to another song.')
      console.warn('[GigaMusic] Audio element error', {
        songId: currentSongRef.current?.id, mediaErrorCode: audio.error?.code,
        hidden: document.hidden, readyState: audio.readyState, networkState: audio.networkState,
      })
    }

    audio.addEventListener('waiting', onBuffering)
    audio.addEventListener('stalled', onBuffering)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('loadedmetadata', syncTime)
    audio.addEventListener('durationchange', syncTime)
    audio.addEventListener('timeupdate', syncTime)
    audio.addEventListener('seeked', syncTime)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    return () => {
      clearStall()
      audio.removeEventListener('waiting', onBuffering)
      audio.removeEventListener('stalled', onBuffering)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('loadedmetadata', syncTime)
      audio.removeEventListener('durationchange', syncTime)
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('seeked', syncTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audio.remove()
      audioRef.current = null
    }
  }, [])

  const toggle = useCallback((song: Song) => {
    const audio = audioRef.current
    if (!audio) return
    const isCurrent = currentSongRef.current?.id === song.id
    // Inspect the real media element rather than possibly stale React state
    // after the phone wakes from a background playback interruption.
    if (isCurrent && !audio.paused) {
      ++playRequestRef.current
      audio.pause()
      setPlayingId(null)
      if (countTimerRef.current) clearTimeout(countTimerRef.current)
      return
    }
    if (isCurrent) retryPlayback()
    else startSong(song)
  }, [retryPlayback, startSong])

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
      ['play', safePlay], ['pause', () => audio.pause()],
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
  }, [currentSong, playNext, playPrevious, retryPlayback, seek])

  const setAutoplay = useCallback((enabled: boolean) => {
    autoplayRef.current = enabled
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
