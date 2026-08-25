import type { Song } from '@/types'

export type SharePlatform = 'x' | 'facebook' | 'instagram' | 'youtube'

/**
 * Instagram/YouTube don't support posting an arbitrary file from the browser
 * without each platform's own OAuth + Content API integration, so those
 * buttons deep-link to the platform's own upload page instead (per spec).
 */
export function shareUrl(platform: SharePlatform, song: Pick<Song, 'title' | 'artist_name'>, songUrl: string): string {
  const text = encodeURIComponent(`Check out "${song.title}" by ${song.artist_name} on GigaMusic`)
  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(songUrl)}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(songUrl)}&quote=${text}`
    case 'youtube':
      return 'https://studio.youtube.com/channel/upload'
    case 'instagram':
      return 'https://www.instagram.com/'
  }
}
