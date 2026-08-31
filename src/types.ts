export const GENRES = [
  'Pop',
  'Hip-Hop',
  'R&B',
  'Rock',
  'Hard Rock',
  'Southern Rock',
  'Metal',
  'Electronic',
  'Lo-fi',
  'Country',
  'Jazz',
  'Gospel',
  'Christian',
  'Ambient',
  'Introspective',
  'Other',
] as const

export type Genre = (typeof GENRES)[number]

export type Album = {
  id: string
  user_id: string
  title: string
  cover_image_url: string | null
  created_at: string
}

export type Song = {
  id: string
  user_id: string
  album_id: string | null
  title: string
  artist_name: string
  genre: string
  lyrics: string | null
  audio_storage_path: string
  duration_seconds: number | null
  play_count: number
  download_count: number
  created_at: string
  scripture_reference?: string | null
  scripture_text?: string | null
  song_meaning?: string | null
  description?: string | null
  artwork_url?: string | null
  visualizer_theme?: string | null
  is_published?: boolean
}

export type Comment = {
  id: string
  song_id: string
  display_name: string
  body: string
  created_at: string
  is_hidden: boolean
}

export type Database = {
  public: {
    Tables: {
      albums: {
        Row: Album
        Insert: {
          id?: string
          user_id: string
          title: string
          cover_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          cover_image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      songs: {
        Row: Song
        Insert: {
          id?: string
          user_id: string
          album_id?: string | null
          title: string
          artist_name: string
          genre: string
          lyrics?: string | null
          audio_storage_path: string
          duration_seconds?: number | null
          play_count?: number
          download_count?: number
          created_at?: string
          scripture_reference?: string | null
          scripture_text?: string | null
          song_meaning?: string | null
          description?: string | null
          artwork_url?: string | null
          visualizer_theme?: string | null
          is_published?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          album_id?: string | null
          title?: string
          artist_name?: string
          genre?: string
          lyrics?: string | null
          audio_storage_path?: string
          duration_seconds?: number | null
          play_count?: number
          download_count?: number
          created_at?: string
          scripture_reference?: string | null
          scripture_text?: string | null
          song_meaning?: string | null
          description?: string | null
          artwork_url?: string | null
          visualizer_theme?: string | null
          is_published?: boolean
        }
        Relationships: []
      }
      comments: {
        Row: Comment
        Insert: {
          id?: string
          song_id: string
          display_name?: string
          body: string
          created_at?: string
          is_hidden?: boolean
        }
        Update: {
          id?: string
          song_id?: string
          display_name?: string
          body?: string
          created_at?: string
          is_hidden?: boolean
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_play_count: { Args: { song_id: string }; Returns: void }
      increment_download_count: { Args: { song_id: string }; Returns: void }
      is_gigamusic_admin: { Args: Record<string, never>; Returns: boolean }
    }
  }
}

export type SongWithAlbum = Song & {
  album: Pick<Album, 'id' | 'title'> | null
  comment_count?: number
}
