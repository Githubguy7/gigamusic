-- GigaMusic schema, RLS policies, and storage buckets.
-- Run via `supabase db push`, or paste into the SQL editor of a fresh Supabase project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  cover_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  album_id uuid references public.albums (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  artist_name text not null check (char_length(trim(artist_name)) > 0),
  genre text not null check (
    genre in ('Pop', 'Hip-Hop', 'R&B', 'Rock', 'Electronic', 'Lo-fi', 'Country', 'Jazz', 'Ambient', 'Other')
  ),
  lyrics text,
  audio_storage_path text not null,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  play_count integer not null default 0 check (play_count >= 0),
  download_count integer not null default 0 check (download_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs (id) on delete cascade,
  display_name text not null default 'Anonymous' check (char_length(trim(display_name)) > 0),
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists songs_album_id_idx on public.songs (album_id);
create index if not exists songs_user_id_idx on public.songs (user_id);
create index if not exists songs_created_at_idx on public.songs (created_at desc);
create index if not exists comments_song_id_idx on public.comments (song_id);
create index if not exists albums_user_id_idx on public.albums (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.albums enable row level security;
alter table public.songs enable row level security;
alter table public.comments enable row level security;

-- albums: public read, owner-only write
create policy "albums are publicly readable"
  on public.albums for select
  using (true);

create policy "owners can insert their own albums"
  on public.albums for insert
  with check (auth.uid() = user_id);

create policy "owners can update their own albums"
  on public.albums for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owners can delete their own albums"
  on public.albums for delete
  using (auth.uid() = user_id);

-- songs: public read, owner-only write. Play/download counters are bumped via
-- the "anyone can increment counters" policy below so anonymous listeners
-- don't need write access to the rest of the row.
create policy "songs are publicly readable"
  on public.songs for select
  using (true);

create policy "owners can insert their own songs"
  on public.songs for insert
  with check (
    auth.uid() = user_id
    and (
      album_id is null
      or exists (
        select 1 from public.albums a
        where a.id = album_id and a.user_id = auth.uid()
      )
    )
  );

create policy "owners can update their own songs"
  on public.songs for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      album_id is null
      or exists (
        select 1 from public.albums a
        where a.id = album_id and a.user_id = auth.uid()
      )
    )
  );

create policy "owners can delete their own songs"
  on public.songs for delete
  using (auth.uid() = user_id);

-- comments: public read of non-hidden comments, open anonymous insert
-- (rate-limit at the application/edge layer — Postgres RLS alone can't throttle
-- by IP), moderation (soft-delete via is_hidden) restricted to the song's owner.
create policy "non-hidden comments are publicly readable"
  on public.comments for select
  using (is_hidden = false);

create policy "song owners can read all comments on their songs"
  on public.comments for select
  using (
    exists (
      select 1 from public.songs s
      where s.id = song_id and s.user_id = auth.uid()
    )
  );

create policy "anyone can post a comment"
  on public.comments for insert
  with check (true);

create policy "song owners can moderate comments on their songs"
  on public.comments for update
  using (
    exists (
      select 1 from public.songs s
      where s.id = song_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.songs s
      where s.id = song_id and s.user_id = auth.uid()
    )
  );

create policy "song owners can delete comments on their songs"
  on public.comments for delete
  using (
    exists (
      select 1 from public.songs s
      where s.id = song_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Counter RPCs (play_count / download_count)
-- Exposed as SECURITY DEFINER functions instead of an open UPDATE policy so
-- anonymous listeners can only ever increment-by-one, never set arbitrary
-- values or touch any other column.
-- ---------------------------------------------------------------------------

create or replace function public.increment_play_count(song_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.songs set play_count = play_count + 1 where id = song_id;
$$;

create or replace function public.increment_download_count(song_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.songs set download_count = download_count + 1 where id = song_id;
$$;

grant execute on function public.increment_play_count(uuid) to anon, authenticated;
grant execute on function public.increment_download_count(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- Files are stored under `${auth.uid()}/...` so ownership can be checked from
-- the storage path alone. Public read, owner-only write; 50MB cap enforced
-- here (audio) and via the app for cover images.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'songs',
  'songs',
  true,
  52428800, -- 50MB
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/flac']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,
  8388608, -- 8MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "songs bucket is publicly readable"
  on storage.objects for select
  using (bucket_id = 'songs');

create policy "covers bucket is publicly readable"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "authenticated users can upload songs to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'songs'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "authenticated users can upload covers to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners can update their own storage objects"
  on storage.objects for update
  using (
    bucket_id in ('songs', 'covers')
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners can delete their own storage objects"
  on storage.objects for delete
  using (
    bucket_id in ('songs', 'covers')
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
