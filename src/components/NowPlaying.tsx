import { Cross, Pause, Play, Sparkles } from 'lucide-react'
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

export function NowPlaying() {
  const { currentSong, progress, toggle, isPlaying } = useAudioPlayer()
  if (!currentSong) return null

  const playing = isPlaying(currentSong.id)
  const theme = currentSong.visualizer_theme || visualTheme(currentSong.title, currentSong.scripture_reference)
  const percent = Math.max(0, Math.min(100, progress * 100))

  return (
    <section className="sticky bottom-4 z-40 mt-8 overflow-hidden rounded-[22px] border border-aurora-teal/25 bg-[rgba(7,8,24,0.92)] shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="relative grid gap-4 p-4 sm:grid-cols-[132px_1fr] sm:p-5">
        <div className="relative flex min-h-[112px] items-center justify-center overflow-hidden rounded-2xl border border-comet-gold/20 bg-[radial-gradient(circle_at_50%_40%,rgba(139,111,232,0.34),rgba(13,15,38,0.94)_66%)]">
          <div className={`absolute h-24 w-24 rounded-full border border-aurora-teal/20 ${playing ? 'animate-ping' : ''}`} />
          <div className={`absolute h-16 w-16 rounded-full bg-nebula-violet/20 blur-xl ${playing ? 'animate-pulse' : ''}`} />
          <Cross size={56} strokeWidth={1.35} className="relative z-10 text-comet-gold drop-shadow-[0_0_18px_rgba(245,205,112,0.45)]" />
          <Sparkles size={16} className="absolute right-3 top-3 text-aurora-teal" />
          <span className="absolute bottom-2.5 left-3 font-mono text-[9px] uppercase tracking-[1.7px] text-[#A9A3CC]">{theme}</span>
        </div>

        <div className="min-w-0 self-center">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[2.2px] text-aurora-teal">Now Playing · Worship Visualizer</div>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => toggle(currentSong)}
              aria-label={playing ? `Pause ${currentSong.title}` : `Play ${currentSong.title}`}
              className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-nebula-violet/40 bg-nebula-violet/15 text-starlight hover:bg-nebula-violet/25"
            >
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
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

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-nebula-violet via-aurora-teal to-comet-gold transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[1.4px] text-[#777294]">
            <span>{playing ? 'Light moving with the music' : 'Paused — your place is saved'}</span>
            <span>{Math.round(percent)}%</span>
          </div>
        </div>
      </div>
    </section>
  )
}
