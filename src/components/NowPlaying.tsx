import { Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Sparkles } from 'lucide-react'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'

function visualTheme(title: string, scripture?: string | null) {
  const source = `${title} ${scripture ?? ''}`.toLowerCase()
  if (source.includes('grace') || source.includes('mercy')) return 'Grace & Mercy'
  if (source.includes('glory') || source.includes('heaven')) return 'Heavenly Glory'
  if (source.includes('fire') || source.includes('spirit')) return 'Holy Fire'
  if (source.includes('light') || source.includes('truth')) return 'Light & Truth'
  if (source.includes('water') || source.includes('river')) return 'Living Water'
  return 'Cross & Creation'
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${(whole % 60).toString().padStart(2, '0')}`
}

function ChristianCross() {
  return (
    <svg viewBox="0 0 64 88" width="58" height="80" aria-hidden="true" className="relative z-10 overflow-visible drop-shadow-[0_0_18px_rgba(245,205,112,0.45)]">
      <path d="M27 4h10v23h18v10H37v47H27V37H9V27h18V4Z" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" className="text-comet-gold" />
    </svg>
  )
}

export function NowPlaying() {
  const {
    currentSong, progress, currentTime, duration, autoplay, hasPrevious, hasNext,
    toggle, seek, seekToProgress, playPrevious, playNext, setAutoplay, isPlaying,
  } = useAudioPlayer()
  if (!currentSong) return null

  const playing = isPlaying(currentSong.id)
  const theme = currentSong.visualizer_theme || visualTheme(currentSong.title, currentSong.scripture_reference)
  const percent = Math.max(0, Math.min(100, progress * 100))
  const displayDuration = duration || currentSong.duration_seconds || 0

  return (
    <section className="sticky bottom-4 z-40 mt-8 overflow-hidden rounded-[22px] border border-aurora-teal/25 bg-[rgba(7,8,24,0.92)] shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="relative grid gap-4 p-4 sm:grid-cols-[132px_1fr] sm:p-5">
        <div className="relative flex min-h-[112px] items-center justify-center overflow-hidden rounded-2xl border border-comet-gold/20 bg-[radial-gradient(circle_at_50%_40%,rgba(139,111,232,0.34),rgba(13,15,38,0.94)_66%)]">
          <div className={`absolute h-24 w-24 rounded-full border border-aurora-teal/20 ${playing ? 'animate-ping' : ''}`} />
          <div className={`absolute h-16 w-16 rounded-full bg-nebula-violet/20 blur-xl ${playing ? 'animate-pulse' : ''}`} />
          <ChristianCross />
          <Sparkles size={16} className="absolute right-3 top-3 text-aurora-teal" />
          <span className="absolute bottom-2.5 left-3 font-mono text-[9px] uppercase tracking-[1.7px] text-[#A9A3CC]">{theme}</span>
        </div>

        <div className="min-w-0 self-center">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[2.2px] text-aurora-teal">Now Playing · Worship Visualizer</span>
            <button type="button" onClick={() => setAutoplay(!autoplay)} aria-pressed={autoplay} className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[1.2px] ${autoplay ? 'border-aurora-teal/40 bg-aurora-teal/10 text-aurora-teal' : 'border-starlight/10 text-[#777294]'}`}>
              Autoplay {autoplay ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex flex-shrink-0 items-center gap-1">
              <button type="button" onClick={playPrevious} disabled={!hasPrevious} aria-label="Previous song" title="Previous song" className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-[#A9A3CC] hover:text-starlight disabled:opacity-25"><SkipBack size={16} /></button>
              <button type="button" onClick={() => toggle(currentSong)} aria-label={playing ? `Pause ${currentSong.title}` : `Play ${currentSong.title}`} className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-nebula-violet/40 bg-nebula-violet/15 text-starlight hover:bg-nebula-violet/25">
                {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
              <button type="button" onClick={playNext} disabled={!hasNext} aria-label="Next song" title="Next song" className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-[#A9A3CC] hover:text-starlight disabled:opacity-25"><SkipForward size={16} /></button>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="m-0 truncate font-display text-xl font-bold text-[#F3F1FF]">{currentSong.title}</h2>
              <p className="m-0 mt-0.5 truncate text-[13px] text-muted">{currentSong.artist_name}</p>
              {(currentSong.scripture_reference || currentSong.song_meaning) && (
                <p className="m-0 mt-2 line-clamp-2 text-[12.5px] leading-5 text-[#BEB8DF]">
                  {currentSong.scripture_reference && <span className="font-semibold text-comet-gold">{currentSong.scripture_reference}</span>}
                  {currentSong.scripture_reference && currentSong.song_meaning && <span className="opacity-50"> · </span>}
                  {currentSong.song_meaning}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <button type="button" onClick={() => seek(currentTime - 10)} aria-label="Rewind 10 seconds" title="Back 10 seconds" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-starlight/10 text-[#A9A3CC] hover:border-nebula-violet/40 hover:text-starlight"><RotateCcw size={14} /></button>
            <div className="min-w-0 flex-1">
              <input type="range" min="0" max="1000" step="1" value={Math.round(progress * 1000)} onChange={(e) => seekToProgress(Number(e.target.value) / 1000)} aria-label="Song position" className="h-2 w-full cursor-pointer accent-[#4FD8C4]" style={{ background: `linear-gradient(to right, #8B6FE8 0%, #4FD8C4 ${percent}%, rgba(255,255,255,0.08) ${percent}%, rgba(255,255,255,0.08) 100%)`, borderRadius: '9999px' }} />
              <div className="mt-1 flex items-center justify-between font-mono text-[9.5px] tracking-[0.6px] text-[#777294]"><span>{formatTime(currentTime)}</span><span>{formatTime(displayDuration)}</span></div>
            </div>
            <button type="button" onClick={() => seek(currentTime + 10)} aria-label="Fast forward 10 seconds" title="Forward 10 seconds" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-starlight/10 text-[#A9A3CC] hover:border-nebula-violet/40 hover:text-starlight"><RotateCw size={14} /></button>
          </div>

          <div className="mt-1.5 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[1.4px] text-[#777294]"><span>{playing ? 'Drag the bar to move through the song' : 'Paused — drag to choose where to resume'}</span><span>{Math.round(percent)}%</span></div>
        </div>
      </div>
    </section>
  )
}
