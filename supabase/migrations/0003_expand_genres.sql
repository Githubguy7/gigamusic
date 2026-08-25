-- Widens the songs.genre check constraint to add Introspective, Christian,
-- Gospel, Metal, Hard Rock, and Southern Rock.

alter table public.songs drop constraint if exists songs_genre_check;

alter table public.songs add constraint songs_genre_check check (
  genre in (
    'Pop', 'Hip-Hop', 'R&B', 'Rock', 'Hard Rock', 'Southern Rock', 'Metal', 'Electronic',
    'Lo-fi', 'Country', 'Jazz', 'Gospel', 'Christian', 'Ambient', 'Introspective', 'Other'
  )
);
