export const GENRES = [
  'Pop',
  'Hip-Hop',
  'R&B',
  'Rock',
  'Electronic',
  'Lo-fi',
  'Country',
  'Jazz',
  'Ambient',
  'Other',
] as const

export type Genre = (typeof GENRES)[number]

// NOTE: these are `type` aliases rather than `interface`s on purpose.
// postgrest-js's generic inference for `.insert()`/`.update()`/`.select()`
// pattern-matches against the Database['public']['Tables'][...] shapes, and
// an `interface` there silently breaks that matching (every call collapses
// to `never`) where a plain object `type` works — a known supabase-js
// gotcha, and why `supabase gen types typescript` also emits `type`.

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
    }
  }
}

/** A song joined with its album title, as returned by the browsing queries. */
export type SongWithAlbum = Song & {
  album: Pick<Album, 'id' | 'title'> | null
  comment_count?: number
}
