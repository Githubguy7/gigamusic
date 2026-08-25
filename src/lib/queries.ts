import { supabase } from '@/lib/supabase'
import type { Album, SongWithAlbum } from '@/types'

const SONG_SELECT = '*, album:albums(id, title), comments(count)'

// The Supabase client types embedded resources generically; narrow the shape
// we actually select before flattening the comment count onto each song.
type RawSong = Omit<SongWithAlbum, 'album' | 'comment_count'> & {
  album: Pick<Album, 'id' | 'title'> | null
  comments: { count: number }[]
}

function withCommentCount(row: RawSong): SongWithAlbum {
  const { comments, ...rest } = row
  return { ...rest, comment_count: comments?.[0]?.count ?? 0 }
}

export async function fetchSongs(): Promise<SongWithAlbum[]> {
  const { data, error } = await supabase
    .from('songs')
    .select(SONG_SELECT)
    .order('created_at', { ascending: false })
    .returns<RawSong[]>()
  if (error) throw error
  return data.map(withCommentCount)
}

export async function fetchSong(id: string): Promise<SongWithAlbum | null> {
  const { data, error } = await supabase
    .from('songs')
    .select(SONG_SELECT)
    .eq('id', id)
    .maybeSingle()
    .returns<RawSong | null>()
  if (error) throw error
  return data ? withCommentCount(data) : null
}

export async function fetchAlbum(id: string): Promise<Album | null> {
  const { data, error } = await supabase.from('albums').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchAlbumSongs(albumId: string): Promise<SongWithAlbum[]> {
  const { data, error } = await supabase
    .from('songs')
    .select(SONG_SELECT)
    .eq('album_id', albumId)
    .order('created_at', { ascending: false })
    .returns<RawSong[]>()
  if (error) throw error
  return data.map(withCommentCount)
}

export async function fetchUserAlbums(userId: string): Promise<Album[]> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('user_id', userId)
    .order('title', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchUserSongs(userId: string): Promise<SongWithAlbum[]> {
  const { data, error } = await supabase
    .from('songs')
    .select(SONG_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<RawSong[]>()
  if (error) throw error
  return data.map(withCommentCount)
}
