import { Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Sparkles } from 'lucide-react'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'

type ThemeName = 'Grace & Mercy' | 'Heavenly Glory' | 'Holy Fire' | 'Light & Truth' | 'Living Water' | 'Cross & Creation'

function visualTheme(title: string, scripture?: string | null, meaning?: string | null, lyrics?: string | null): ThemeName {
  const source = `${title} ${scripture ?? ''} ${meaning ?? ''} ${lyrics ?? ''}`.toLowerCase()
  if (source.includes('grace') || source.includes('mercy') || source.includes('forgive')) return 'Grace & Mercy'
  if (source.includes('glory') || source.includes('heaven') || source.includes('crown')) return 'Heavenly Glory'
  if (source.includes('fire') || source.includes('spirit') || source.includes('pentecost')) return 'Holy Fire'
  if (source.includes('light') || source.includes('truth') || source.includes('word')) return 'Light & Truth'
  if (source.includes('water') || source.includes('river') || source.includes('thirst')) return 'Living Water'
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

function ThemeVisual({ theme, playing }: { theme: ThemeName; playing: boolean }) {
  if (theme === 'Holy Fire') {
    return (
      <div className="relative z-10 flex h-[92px] w-[92px] items-end justify-center" aria-hidden="true">
        <div className={`absolute bottom-2 h-16 w-12 rounded-[50%_50%_46%_46%] bg-[radial-gradient(circle_at_50%_75%,rgba(255,231,160,0.95),rgba(244,136,63,0.82)_42%,rgba(145,62,223,0.38)_72%,transparent_76%)] blur-[1px] ${playing ? 'animate-pulse' : ''}`} />
        <div className="absolute bottom-0 h-8 w-20 rounded-full bg-orange-300/15 blur-xl" />
        <ChristianCross />
      </div>
    )
  }

  if (theme === 'Living Water') {
    return (
      <div className="relative z-10 h-[92px] w-[100px]" aria-hidden="true">
        <div className={`absolute left-1/2 top-2 h-12 w-12 -translate-x-1/2 rounded-[55%_45%_60%_40%] border-2 border-aurora-teal/80 bg-aurora-teal/10 ${playing ? 'animate-pulse' : ''}`} style={{ transform: 'translateX(-50%) rotate(45deg)' }} />
        <div className="absolute bottom-4 left-2 right-2 h-1.5 rounded-full bg-aurora-teal/40" />
        <div className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-nebula-violet/35" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scale-[0.65]"><ChristianCross /></div>
      </div>
    )
  }

  if (theme === 'Heavenly Glory') {
    return (
      <div className="relative z-10 flex h-[92px] w-[104px] items-center justify-center" aria-hidden="true">
        <div className={`absolute h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(255,241,183,0.42),rgba(139,111,232,0.18)_48%,transparent_72%)] ${playing ? 'animate-pulse' : ''}`} />
        <div className="absolute top-3 h-3 w-12 rounded-[50%] border-2 border-comet-gold/70" />
        <div className="absolute bottom-3 left-1 h-6 w-12 rounded-full bg-white/10 blur-sm" />
        <div className="absolute bottom-2 right-0 h-7 w-14 rounded-full bg-white/10 blur-sm" />
        <ChristianCross />
      </div>
    )
  }

  if (theme === 'Light & Truth') {
    return (
      <div className="relative z-10 flex h-[92px] w-[104px] items-center justify-center" aria-hidden="true">
        <div className={`absolute h-24 w-24 bg-[conic-gradient(from_0deg,transparent,rgba(79,216,196,0.2),transparent,rgba(245,205,112,0.18),transparent)] ${playing ? 'animate-spin' : ''}`} style={{ animationDuration: '14s' }} />
        <div className="absolute h-20 w-2 rounded-full bg-comet-gold/10 blur-sm" />
        <ChristianCross />
      </div>
    )
  }

  if (theme === 'Grace & Mercy') {
    return (
      <div className="relative z-10 flex h-[92px] w-[104px] items-center justify-center" aria-hidden="true">
        <div className={`absolute h-20 w-20 rounded-full border border-white/15 bg-[radial-gradient(circle,rgba(255,255,255,0.14),rgba(139,111,232,0.12)_55%,transparent_72%)] ${playing ? 'animate-pulse' : ''}`} />
        <div className="absolute left-1 top-5 h-6 w-10 rotate-[-18deg] rounded-[100%_0_100%_0] border border-white/25" />
        <div className="absolute right-1 top-5 h-6 w-10 rotate-[18deg] rounded-[0_100%_0_100%] border border-white/25" />
        <ChristianCross />
      </div>
    )
  }

  return (
    <div className="relative z-10 flex h-[92px] w-[104px] items-center justify-center" aria-hidden="true">
      <div className={`absolute h-24 w-24 rounded-full border border-aurora-teal/20 ${playing ? 'animate-ping' : ''}`} />
      <div className={`absolute h-16 w-16 rounded-full bg-nebula-violet/20 blur-xl ${playing ? 'animate-pulse' : ''}`} />
      <div className="absolute bottom-1 left-0 right-0 h-8 bg-[linear-gradient(160deg,transparent_0_28%,rgba(139,111,232,0.18)_29%_52%,transparent_53%),linear-gradient(25deg,transparent_0_38%,rgba(79,216,196,0.12)_39%_58%,transparent_59%)]" />
      <ChristianCross />
    </div>
  )
}

function themeBackground(theme: ThemeName) {
  if (theme === 'Holy Fire') return 'radial-gradient(circle at 50% 78%, rgba(244,136,63,0.30), rgba(61,28,92,0.32) 40%, rgba(13,15,38,0.96) 72%)'
  if (theme === 'Living Water') return 'radial-gradient(circle at 50% 68%, rgba(79,216,196,0.28), rgba(34,69,112,0.30) 44%, rgba(13,15,38,0.96) 72%)'
  if (theme === 'Heavenly Glory') return 'radial-gradient(circle at 50% 36%, rgba(245,205,112,0.30), rgba(139,111,232,0.24) 44%, rgba(13,15,38,0.96) 72%)'
  if (theme === 'Light & Truth') return 'radial-gradient(circle at 50% 40%, rgba(245,205,112,0.20), rgba(79,216,196,0.20) 40%, rgba(13,15,38,0.96) 72%)'
  if (theme === 'Grace & Mercy') return 'radial-gradient(circle at 50% 44%, rgba(255,255,255,0.16), rgba(139,111,232,0.25) 46%, rgba(13,15,38,0.96) 72%)'
  return 'radial-gradient(circle at 50% 40%, rgba(139,111,232,0.34), rgba(13,15,38,0.94) 66%)'
}

export function NowPlaying() {
  const {
    currentSong, progress, currentTime, duration, autoplay, hasPrevious, hasNext,
    toggle, seek, seekToProgress, playPrevious, playNext, setAutoplay, isPlaying,
  } = useAudioPlayer()
  if (!currentSong) return null

  const playing = isPlaying(currentSong.id)
  const inferredTheme = visualTheme(currentSong.title, currentSong.scripture_reference, currentSong.song_meaning, currentSong.lyrics)
  const theme = (currentSong.visualizer_theme as ThemeName | null) || inferredTheme
  const percent = Math.max(0, Math.min(100, progress * 100))
  const displayDuration = duration || currentSong.duration_seconds || 0

  return (
    <section className="sticky bottom-4 z-40 mt-8 overflow-hidden rounded-[22px] border border-aurora-teal/25 bg-[rgba(7,8,24,0.92)] shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="relative grid gap-4 p-4 sm:grid-cols-[148px_1fr] sm:p-5">
        <div className="relative flex min-h-[126px] items-center justify-center overflow-hidden rounded-2xl border border-comet-gold/20" style={{ background: themeBackground(theme) }}>
          <div className="absolute inset-0 opacity-55" style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,.72) 0 1px, transparent 1.4px), radial-gradient(circle at 82% 28%, rgba(255,255,255,.52) 0 1px, transparent 1.4px), radial-gradient(circle at 70% 74%, rgba(79,216,196,.60) 0 1px, transparent 1.4px), radial-gradient(circle at 30% 82%, rgba(245,205,112,.55) 0 1px, transparent 1.4px)' }} />
          <ThemeVisual theme={theme} playing={playing} />
          <Sparkles size={16} className="absolute right-3 top-3 text-aurora-teal" />
          <span className="absolute bottom-2.5 left-3 font-mono text-[9px] uppercase tracking-[1.7px] text-[#C8C2EA]">{theme}</span>
        </div>

        <div className="min-w-0 self-center">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[2.2px] text-aurora-teal">Now Playing · Worship Visualizer</span>
            <button type="button" onClick={() => setAutoplay(!autoplay)} aria-pressed={autoplay} className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[1.2px] ${autoplay ? 'border-aurora-teal/40 bg-aurora-teal/10 text-aurora-teal' : 'border-starlight/10 text-[#777294]'}`}>Autoplay {autoplay ? 'On' : 'Off'}</button>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex flex-shrink-0 items-center gap-1">
              <button type="button" onClick={playPrevious} disabled={!hasPrevious} aria-label="Previous song" title="Previous song" className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-[#A9A3CC] hover:text-starlight disabled:opacity-25"><SkipBack size={16} /></button>
              <button type="button" onClick={() => toggle(currentSong)} aria-label={playing ? `Pause ${currentSong.title}` : `Play ${currentSong.title}`} className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-nebula-violet/40 bg-nebula-violet/15 text-starlight hover:bg-nebula-violet/25">{playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}</button>
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

          <div className="mt-1.5 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[1.4px] text-[#777294]"><span>{playing ? `Theme: ${theme} · move through the song anytime` : 'Paused — drag to choose where to resume'}</span><span>{Math.round(percent)}%</span></div>
        </div>
      </div>
    </section>
  )
}
