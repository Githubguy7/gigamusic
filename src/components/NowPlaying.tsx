import { Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward } from 'lucide-react'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'

type ThemeName =
  | 'Grace & Mercy'
  | 'Heavenly Glory'
  | 'Holy Fire'
  | 'Light & Truth'
  | 'Living Water'
  | 'Cross & Creation'
  | 'Resurrection Dawn'
  | 'Lion & Lamb'
  | 'Armor of God'
  | 'Prayer & Presence'
  | 'New Creation'
  | "Shepherd's Way"

const THEMES: ThemeName[] = [
  'Grace & Mercy', 'Heavenly Glory', 'Holy Fire', 'Light & Truth', 'Living Water', 'Cross & Creation',
  'Resurrection Dawn', 'Lion & Lamb', 'Armor of God', 'Prayer & Presence', 'New Creation', "Shepherd's Way",
]

function fallbackTheme(seed: string): ThemeName {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return THEMES[hash % THEMES.length]
}

function visualTheme(title: string, scripture?: string | null, meaning?: string | null, lyrics?: string | null, id?: string): ThemeName {
  const source = `${title} ${scripture ?? ''} ${meaning ?? ''} ${lyrics ?? ''}`.toLowerCase()
  if (/(resurrection|risen|rise again|empty tomb|alive again|easter)/.test(source)) return 'Resurrection Dawn'
  if (/(lion|lamb|judah|worthy is the lamb)/.test(source)) return 'Lion & Lamb'
  if (/(armor|shield|sword|helmet|battle|warrior|stronghold)/.test(source)) return 'Armor of God'
  if (/(prayer|pray|presence|kneel|altar|stillness|secret place)/.test(source)) return 'Prayer & Presence'
  if (/(new creation|made new|renew|restore|restoration|reborn|new heart)/.test(source)) return 'New Creation'
  if (/(shepherd|pasture|valley|psalm 23|rod|staff|lead me)/.test(source)) return "Shepherd's Way"
  if (/(grace|mercy|forgive|forgiveness|redeem|redemption)/.test(source)) return 'Grace & Mercy'
  if (/(glory|heaven|crown|kingdom|throne|majesty)/.test(source)) return 'Heavenly Glory'
  if (/(fire|spirit|pentecost|flame|burning|holy ghost)/.test(source)) return 'Holy Fire'
  if (/(light|truth|word|scripture|lamp|path|revelation)/.test(source)) return 'Light & Truth'
  if (/(water|river|thirst|fountain|well|living water)/.test(source)) return 'Living Water'
  if (/(cross|calvary|creation|earth|creator|stars|heavens)/.test(source)) return 'Cross & Creation'
  return fallbackTheme(`${id ?? ''}:${title}`)
}

function validStoredTheme(value?: string | null): ThemeName | null {
  if (!value || value.trim().toLowerCase() === 'auto') return null
  return THEMES.includes(value as ThemeName) ? (value as ThemeName) : null
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${(whole % 60).toString().padStart(2, '0')}`
}

function ChristianCross({ scale = 1 }: { scale?: number }) {
  return (
    <svg viewBox="0 0 64 88" width={58 * scale} height={80 * scale} aria-hidden="true" className="relative z-10 overflow-visible drop-shadow-[0_0_20px_rgba(245,205,112,0.48)]">
      <path d="M27 4h10v23h18v10H37v47H27V37H9V27h18V4Z" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" className="text-comet-gold" />
    </svg>
  )
}

function ThemeVisual({ theme, playing }: { theme: ThemeName; playing: boolean }) {
  const pulse = playing ? 'animate-pulse' : ''
  if (theme === 'Resurrection Dawn') return <div className="relative z-10 h-[102px] w-[116px]" aria-hidden="true"><div className="absolute inset-x-1 bottom-2 h-10 rounded-[50%_50%_0_0] bg-[linear-gradient(to_top,rgba(36,31,67,.9),rgba(36,31,67,.2))]"/><div className={`absolute left-1/2 top-3 h-20 w-20 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,236,172,.72),rgba(245,168,88,.26)_45%,transparent_72%)] ${pulse}`}/><div className="absolute bottom-2 left-2 right-2 h-px bg-comet-gold/50"/><div className="absolute bottom-3 left-1/2 -translate-x-1/2"><ChristianCross scale={0.78}/></div></div>
  if (theme === 'Lion & Lamb') return <div className="relative z-10 flex h-[102px] w-[116px] items-center justify-center" aria-hidden="true"><div className={`absolute h-24 w-24 rounded-full border border-comet-gold/20 bg-[radial-gradient(circle,rgba(245,205,112,.24),rgba(83,54,36,.16)_48%,transparent_72%)] ${pulse}`}/><div className="absolute left-2 top-5 h-10 w-10 rounded-full border-2 border-comet-gold/60"/><div className="absolute left-4 top-8 h-4 w-6 rounded-[50%] border border-comet-gold/45"/><div className="absolute right-2 top-5 h-10 w-10 rounded-full border-2 border-white/45"/><div className="absolute right-5 top-8 h-4 w-5 rounded-[50%] border border-white/35"/><div className="absolute bottom-1"><ChristianCross scale={0.55}/></div></div>
  if (theme === 'Armor of God') return <div className="relative z-10 h-[102px] w-[116px]" aria-hidden="true"><div className={`absolute left-1/2 top-3 h-20 w-16 -translate-x-1/2 rounded-[45%_45%_56%_56%] border-2 border-comet-gold/65 bg-[linear-gradient(180deg,rgba(245,205,112,.12),rgba(45,35,75,.18))] ${pulse}`}/><div className="absolute left-1/2 top-5 h-10 w-px -translate-x-1/2 bg-comet-gold/65"/><div className="absolute left-1/2 top-10 h-px w-9 -translate-x-1/2 bg-comet-gold/65"/><div className="absolute right-1 top-4 h-20 w-[2px] rotate-[18deg] bg-starlight/70"/><div className="absolute right-[-2px] top-3 h-3 w-3 rotate-45 border-r border-t border-starlight/70"/></div>
  if (theme === 'Prayer & Presence') return <div className="relative z-10 h-[102px] w-[116px]" aria-hidden="true"><div className={`absolute left-1/2 top-2 h-20 w-20 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,111,232,.34),rgba(79,216,196,.09)_52%,transparent_73%)] ${pulse}`}/><div className="absolute left-1/2 top-7 h-9 w-5 -translate-x-5 rotate-12 rounded-full border border-white/45"/><div className="absolute left-1/2 top-7 h-9 w-5 translate-x-0 -rotate-12 rounded-full border border-white/45"/><div className="absolute bottom-1 left-1/2 -translate-x-1/2"><ChristianCross scale={0.5}/></div></div>
  if (theme === 'New Creation') return <div className="relative z-10 h-[102px] w-[116px]" aria-hidden="true"><div className={`absolute left-1/2 top-2 h-20 w-20 -translate-x-1/2 rounded-full border border-aurora-teal/35 bg-[radial-gradient(circle,rgba(79,216,196,.22),rgba(33,94,89,.10)_50%,transparent_72%)] ${pulse}`}/><div className="absolute left-3 top-9 h-7 w-12 rotate-[-18deg] rounded-[100%_0_100%_0] border border-aurora-teal/60"/><div className="absolute right-3 top-9 h-7 w-12 rotate-[18deg] rounded-[0_100%_0_100%] border border-aurora-teal/60"/><div className="absolute bottom-1 left-1/2 -translate-x-1/2"><ChristianCross scale={0.5}/></div></div>
  if (theme === "Shepherd's Way") return <div className="relative z-10 h-[102px] w-[116px]" aria-hidden="true"><div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(160deg,transparent_0_30%,rgba(79,216,196,.16)_31%_60%,transparent_61%),linear-gradient(20deg,transparent_0_35%,rgba(139,111,232,.16)_36%_62%,transparent_63%)]"/><div className="absolute right-4 top-7 h-14 w-7 rounded-[60%_40%_0_0] border-r-2 border-t-2 border-comet-gold/75"/><div className={`absolute left-4 top-4 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(245,205,112,.24),transparent_70%)] ${pulse}`}/><div className="absolute bottom-1 left-1/2 -translate-x-1/2"><ChristianCross scale={0.45}/></div></div>
  if (theme === 'Holy Fire') return <div className="relative z-10 flex h-[102px] w-[116px] items-end justify-center" aria-hidden="true"><div className={`absolute bottom-2 h-20 w-14 rounded-[50%_50%_42%_42%] bg-[radial-gradient(circle_at_50%_76%,rgba(255,245,194,.98),rgba(255,165,75,.88)_35%,rgba(179,69,225,.44)_67%,transparent_72%)] blur-[1px] ${pulse}`}/><div className="absolute bottom-0 h-9 w-24 rounded-full bg-orange-300/15 blur-xl"/><ChristianCross scale={0.85}/></div>
  if (theme === 'Living Water') return <div className="relative z-10 h-[102px] w-[116px]" aria-hidden="true"><div className={`absolute left-1/2 top-1 h-14 w-14 rounded-[55%_45%_60%_40%] border-2 border-aurora-teal/80 bg-aurora-teal/10 ${pulse}`} style={{ transform:'translateX(-50%) rotate(45deg)' }}/><div className="absolute bottom-6 left-1 right-1 h-1.5 rounded-full bg-aurora-teal/55 shadow-[0_0_14px_rgba(79,216,196,.25)]"/><div className="absolute bottom-2 left-4 right-4 h-1 rounded-full bg-nebula-violet/40"/><div className="absolute bottom-7 left-1/2 -translate-x-1/2"><ChristianCross scale={0.48}/></div></div>
  if (theme === 'Heavenly Glory') return <div className="relative z-10 flex h-[102px] w-[116px] items-center justify-center" aria-hidden="true"><div className={`absolute h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,241,183,.50),rgba(139,111,232,.20)_46%,transparent_70%)] ${pulse}`}/><div className="absolute top-2 h-3 w-14 rounded-[50%] border-2 border-comet-gold/75"/><div className="absolute bottom-2 left-0 h-7 w-14 rounded-full bg-white/10 blur-sm"/><div className="absolute bottom-1 right-0 h-8 w-16 rounded-full bg-white/10 blur-sm"/><ChristianCross scale={0.8}/></div>
  if (theme === 'Light & Truth') return <div className="relative z-10 flex h-[102px] w-[116px] items-center justify-center" aria-hidden="true"><div className={`absolute h-28 w-28 bg-[conic-gradient(from_0deg,transparent,rgba(79,216,196,.22),transparent,rgba(245,205,112,.22),transparent)] ${playing ? 'animate-spin' : ''}`} style={{ animationDuration:'18s' }}/><div className="absolute h-24 w-3 rounded-full bg-comet-gold/10 blur-md"/><ChristianCross scale={0.82}/></div>
  if (theme === 'Grace & Mercy') return <div className="relative z-10 flex h-[102px] w-[116px] items-center justify-center" aria-hidden="true"><div className={`absolute h-24 w-24 rounded-full border border-white/15 bg-[radial-gradient(circle,rgba(255,255,255,.17),rgba(139,111,232,.14)_55%,transparent_72%)] ${pulse}`}/><div className="absolute left-1 top-5 h-7 w-12 rotate-[-18deg] rounded-[100%_0_100%_0] border border-white/28"/><div className="absolute right-1 top-5 h-7 w-12 rotate-[18deg] rounded-[0_100%_0_100%] border border-white/28"/><ChristianCross scale={0.82}/></div>
  return <div className="relative z-10 flex h-[102px] w-[116px] items-center justify-center" aria-hidden="true"><div className={`absolute h-28 w-28 rounded-full border border-aurora-teal/18 ${playing ? 'animate-ping' : ''}`}/><div className={`absolute h-20 w-20 rounded-full bg-nebula-violet/20 blur-xl ${pulse}`}/><div className="absolute bottom-0 left-0 right-0 h-10 bg-[linear-gradient(160deg,transparent_0_28%,rgba(139,111,232,.18)_29%_52%,transparent_53%),linear-gradient(25deg,transparent_0_38%,rgba(79,216,196,.13)_39%_58%,transparent_59%)]"/><ChristianCross scale={0.84}/></div>
}

function themeBackground(theme: ThemeName) {
  const map: Record<ThemeName,string> = {
    'Grace & Mercy':'radial-gradient(circle at 50% 42%,rgba(255,255,255,.18),rgba(139,111,232,.26) 44%,rgba(10,12,31,.98) 76%)',
    'Heavenly Glory':'radial-gradient(circle at 50% 30%,rgba(245,205,112,.34),rgba(139,111,232,.25) 45%,rgba(10,12,31,.98) 76%)',
    'Holy Fire':'radial-gradient(circle at 50% 82%,rgba(244,136,63,.36),rgba(84,34,98,.35) 40%,rgba(10,12,31,.98) 76%)',
    'Light & Truth':'radial-gradient(circle at 50% 40%,rgba(245,205,112,.24),rgba(79,216,196,.20) 38%,rgba(10,12,31,.98) 76%)',
    'Living Water':'radial-gradient(circle at 50% 68%,rgba(79,216,196,.30),rgba(33,77,124,.30) 44%,rgba(10,12,31,.98) 76%)',
    'Cross & Creation':'radial-gradient(circle at 50% 40%,rgba(139,111,232,.36),rgba(10,12,31,.96) 66%)',
    'Resurrection Dawn':'linear-gradient(180deg,rgba(255,184,99,.23),rgba(139,111,232,.20) 46%,rgba(10,12,31,.98) 78%)',
    'Lion & Lamb':'radial-gradient(circle at 50% 44%,rgba(245,205,112,.28),rgba(78,52,44,.22) 45%,rgba(10,12,31,.98) 76%)',
    'Armor of God':'radial-gradient(circle at 50% 48%,rgba(245,205,112,.18),rgba(64,72,108,.23) 45%,rgba(10,12,31,.98) 76%)',
    'Prayer & Presence':'radial-gradient(circle at 50% 40%,rgba(139,111,232,.32),rgba(79,216,196,.12) 44%,rgba(10,12,31,.98) 76%)',
    'New Creation':'radial-gradient(circle at 50% 48%,rgba(79,216,196,.28),rgba(34,103,83,.18) 45%,rgba(10,12,31,.98) 76%)',
    "Shepherd's Way":'linear-gradient(180deg,rgba(88,106,164,.18),rgba(64,95,76,.20) 52%,rgba(10,12,31,.98) 82%)',
  }
  return map[theme]
}

export function NowPlaying() {
  const { currentSong, progress, currentTime, duration, autoplay, hasPrevious, hasNext, toggle, seek, seekToProgress, playPrevious, playNext, setAutoplay, isPlaying } = useAudioPlayer()
  if (!currentSong) return null
  const playing = isPlaying(currentSong.id)
  const inferredTheme = visualTheme(currentSong.title,currentSong.scripture_reference,currentSong.song_meaning,currentSong.lyrics,currentSong.id)
  const theme = validStoredTheme(currentSong.visualizer_theme) ?? inferredTheme
  const percent = Math.max(0,Math.min(100,progress*100))
  const displayDuration = duration || currentSong.duration_seconds || 0

  return <section className="sticky bottom-4 z-40 mt-8 overflow-hidden rounded-[24px] border border-aurora-teal/25 bg-[rgba(6,7,22,.93)] shadow-[0_22px_80px_rgba(0,0,0,.60)] backdrop-blur-2xl">
    <div className="relative grid gap-4 p-4 sm:grid-cols-[158px_1fr] sm:p-5">
      <div className="relative flex min-h-[136px] items-center justify-center overflow-hidden rounded-[20px] border border-comet-gold/20" style={{background:themeBackground(theme)}}>
        <div className="absolute inset-0 opacity-55" style={{backgroundImage:'radial-gradient(circle at 12% 18%,rgba(255,255,255,.72) 0 1px,transparent 1.4px),radial-gradient(circle at 83% 22%,rgba(255,255,255,.50) 0 1px,transparent 1.4px),radial-gradient(circle at 72% 72%,rgba(79,216,196,.52) 0 1px,transparent 1.4px),radial-gradient(circle at 28% 84%,rgba(245,205,112,.55) 0 1px,transparent 1.4px)' }}/>
        <ThemeVisual theme={theme} playing={playing}/>
        <span className="absolute bottom-2.5 left-3 rounded-full border border-white/10 bg-black/10 px-2 py-1 font-mono text-[8.5px] uppercase tracking-[1.5px] text-[#D8D3F2]">{theme}</span>
      </div>

      <div className="min-w-0 self-center">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[10px] uppercase tracking-[2.2px] text-aurora-teal">Now Playing · Worship Visualizer</span><button type="button" onClick={()=>setAutoplay(!autoplay)} aria-pressed={autoplay} className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[1.2px] ${autoplay?'border-aurora-teal/40 bg-aurora-teal/10 text-aurora-teal':'border-starlight/10 text-[#777294]'}`}>Autoplay {autoplay?'On':'Off'}</button></div>
        <div className="flex items-start gap-3"><div className="flex flex-shrink-0 items-center gap-1"><button type="button" onClick={playPrevious} disabled={!hasPrevious} aria-label="Previous song" className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-[#A9A3CC] hover:text-starlight disabled:opacity-25"><SkipBack size={16}/></button><button type="button" onClick={()=>toggle(currentSong)} aria-label={playing?`Pause ${currentSong.title}`:`Play ${currentSong.title}`} className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-nebula-violet/40 bg-nebula-violet/15 text-starlight hover:bg-nebula-violet/25">{playing?<Pause size={18}/>:<Play size={18} className="ml-0.5"/>}</button><button type="button" onClick={playNext} disabled={!hasNext} aria-label="Next song" className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-[#A9A3CC] hover:text-starlight disabled:opacity-25"><SkipForward size={16}/></button></div><div className="min-w-0 flex-1"><h2 className="m-0 truncate font-display text-xl font-bold text-[#F3F1FF]">{currentSong.title}</h2><p className="m-0 mt-0.5 truncate text-[13px] text-muted">{currentSong.artist_name}</p>{(currentSong.scripture_reference||currentSong.song_meaning)&&<p className="m-0 mt-2 line-clamp-2 text-[12.5px] leading-5 text-[#BEB8DF]">{currentSong.scripture_reference&&<span className="font-semibold text-comet-gold">{currentSong.scripture_reference}</span>}{currentSong.scripture_reference&&currentSong.song_meaning&&<span className="opacity-50"> · </span>}{currentSong.song_meaning}</p>}</div></div>
        <div className="mt-3 flex items-center gap-2.5"><button type="button" onClick={()=>seek(currentTime-10)} aria-label="Rewind 10 seconds" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-starlight/10 text-[#A9A3CC] hover:border-nebula-violet/40 hover:text-starlight"><RotateCcw size={14}/></button><div className="min-w-0 flex-1"><input type="range" min="0" max="1000" step="1" value={Math.round(progress*1000)} onChange={(e)=>seekToProgress(Number(e.target.value)/1000)} aria-label="Song position" className="h-2 w-full cursor-pointer accent-[#4FD8C4]" style={{background:`linear-gradient(to right,#8B6FE8 0%,#4FD8C4 ${percent}%,rgba(255,255,255,.08) ${percent}%,rgba(255,255,255,.08) 100%)`,borderRadius:'9999px'}}/><div className="mt-1 flex items-center justify-between font-mono text-[9.5px] tracking-[.6px] text-[#777294]"><span>{formatTime(currentTime)}</span><span>{formatTime(displayDuration)}</span></div></div><button type="button" onClick={()=>seek(currentTime+10)} aria-label="Fast forward 10 seconds" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-starlight/10 text-[#A9A3CC] hover:border-nebula-violet/40 hover:text-starlight"><RotateCw size={14}/></button></div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[1.4px] text-[#777294]"><span>{playing?`Theme: ${theme} · music-reactive worship scene`:'Paused — drag to choose where to resume'}</span><span>{Math.round(percent)}%</span></div>
      </div>
    </div>
  </section>
}
