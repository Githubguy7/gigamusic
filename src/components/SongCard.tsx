import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Play,
  Pause,
  Download,
  MessageCircle,
  Music2,
  Share2,
  Camera,
  Video,
  X as XIcon,
} from 'lucide-react'
import { GenrePill } from '@/components/GenrePill'
import { IconBtn, IconLink } from '@/components/IconBtn'
import { CommentThread } from '@/components/CommentThread'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { supabase, getAudioDownloadUrl } from '@/lib/supabase'
import { formatDuration } from '@/lib/format'
import { shareUrl } from '@/lib/share'
import type { SongWithAlbum } from '@/types'

interface SongCardProps {
  song: SongWithAlbum
  lyricsDefaultOpen?: boolean
  commentsDefaultOpen?: boolean
}

export function SongCard({ song, lyricsDefaultOpen = false, commentsDefaultOpen = false }: SongCardProps) {
  const { toggle, isPlaying } = useAudioPlayer()
  const [showLyrics, setShowLyrics] = useState(lyricsDefaultOpen)
  const [showComments, setShowComments] = useState(commentsDefaultOpen)
  const playing = isPlaying(song.id)

  const songUrl = `${window.location.origin}/song/${song.id}`

  const handleDownload = async () => {
    await supabase.rpc('increment_download_count', { song_id: song.id })
    const ext = song.audio_storage_path.split('.').pop() || 'mp3'
    const a = document.createElement('a')
    a.href = getAudioDownloadUrl(song.audio_storage_path, `${song.title}.${ext}`)
    a.click()
  }

  return (
    <div className="relative rounded-[18px] border border-nebula-violet/[0.22] bg-gradient-to-b from-[rgba(26,18,51,0.55)] to-[rgba(10,10,24,0.55)] p-5 pb-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          onClick={() => toggle(song)}
          aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`}
          className={`flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full border border-nebula-violet/50 ${
            playing ? 'text-aurora-teal' : 'text-[#C9C2F0]'
          }`}
          style={{
            background: playing
              ? 'radial-gradient(circle, rgba(79,216,196,0.35), rgba(79,216,196,0.05))'
              : 'radial-gradient(circle, rgba(139,111,232,0.35), rgba(139,111,232,0.05))',
          }}
        >
          {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="m-0 truncate font-display text-lg font-bold text-[#F3F1FF]">
                <Link to={`/song/${song.id}`} className="hover:underline">
                  {song.title}
                </Link>
              </h3>
              <p className="m-0 mt-0.5 text-[13px] text-muted">
                {song.artist_name}
                {song.album && (
                  <>
                    {' '}
                    <span className="opacity-50">·</span>{' '}
                    <Link to={`/album/${song.album.id}`} className="hover:underline">
                      {song.album.title}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <span className="flex-shrink-0 pt-[3px] font-mono text-xs text-[#7A7699]">
              {formatDuration(song.duration_seconds)}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <GenrePill genre={song.genre} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <IconBtn title="Lyrics" onClick={() => setShowLyrics((v) => !v)} active={showLyrics}>
            <Music2 size={16} />
          </IconBtn>
          <IconBtn title="Comments" onClick={() => setShowComments((v) => !v)} active={showComments}>
            <MessageCircle size={16} />
          </IconBtn>
          <IconBtn title="Download" onClick={handleDownload}>
            <Download size={16} />
          </IconBtn>
        </div>
        <div className="flex gap-1.5">
          <IconLink href={shareUrl('x', song, songUrl)} target="_blank" rel="noreferrer" title="Share to X">
            <XIcon size={15} />
          </IconLink>
          <IconLink
            href={shareUrl('facebook', song, songUrl)}
            target="_blank"
            rel="noreferrer"
            title="Share to Facebook"
          >
            <Share2 size={15} />
          </IconLink>
          <IconLink
            href={shareUrl('instagram', song, songUrl)}
            target="_blank"
            rel="noreferrer"
            title="Upload to Instagram"
          >
            <Camera size={15} />
          </IconLink>
          <IconLink
            href={shareUrl('youtube', song, songUrl)}
            target="_blank"
            rel="noreferrer"
            title="Upload to YouTube"
          >
            <Video size={15} />
          </IconLink>
        </div>
      </div>

      {showLyrics && (
        <div className="mt-3.5 whitespace-pre-line rounded-xl border border-starlight/[0.08] bg-[rgba(6,7,20,0.5)] px-3.5 py-3 text-[13.5px] leading-[1.7] text-[#C9C2F0]">
          {song.lyrics || 'No lyrics provided for this track.'}
        </div>
      )}

      {showComments && <CommentThread songId={song.id} />}
    </div>
  )
}
