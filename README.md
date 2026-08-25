# GigaMusic

gigamusic.org — Michael's songs, hosted on infrastructure he owns directly (Supabase + Vercel), so no third party can make it disappear again.

React + Vite + TypeScript + Tailwind + Framer Motion, backed by Supabase (Postgres, Auth, Storage).

## Setup

```bash
npm install
cp .env.example .env.local
```

1. Create a [Supabase](https://supabase.com) project.
2. In **Project Settings → API**, copy the Project URL and `anon` public key into `.env.local`.
3. Run the migration in `supabase/migrations/0001_init.sql` — either via the SQL editor in the Supabase dashboard, or with the CLI:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   This creates the `albums`/`songs`/`comments` tables, RLS policies, the `songs`/`covers` storage buckets, and the storage/RLS policies restricting writes to each user's own folder.
4. In **Authentication → Providers**, confirm Email (magic link) is enabled. Under **Authentication → URL Configuration**, add your dev (`http://localhost:5173`) and production URLs as redirect URLs.
5. `npm run dev`

## Data model

- **albums** — `title`, `cover_image_url`, owned by a user.
- **songs** — `title`, `artist_name`, `genre`, `lyrics`, `audio_storage_path`, `duration_seconds`, `play_count`, `download_count`; belongs to an album or is a "Single" (`album_id` null).
- **comments** — public, unauthenticated writes allowed (`display_name` + `body`); moderation is a soft-delete (`is_hidden`) restricted to the song's owner.

Songs/albums are publicly readable; writes are scoped to the owning user via Supabase Auth + RLS. `play_count`/`download_count` are bumped through `increment_play_count`/`increment_download_count` RPCs (SECURITY DEFINER functions) rather than an open UPDATE policy, so anonymous listeners can only ever increment by one.

## Pages

- `/` — song grid
- `/album/:id` — single album
- `/song/:id` — deep link to one song, lyrics + comments expanded
- `/upload` — single + bulk upload (sign-in required)
- `/admin` — manage your songs, trigger a manual export (sign-in required)

Sign-in is a Supabase magic link — no passwords.

## Backups

This is the non-negotiable feature: the previous build of this site (on Manus.im) was lost along with its promised backups when Manus's Meta merger fell through. This rebuild treats backups as core, not an afterthought.

**Manual — "Export everything" (`/admin`)**
Zips every song's audio plus a `metadata.json` (albums, songs, comments) and downloads it straight from the browser. No setup required; works against the public-read data, so any admin can run it on demand.

**Automated — nightly Edge Function (`supabase/functions/nightly-backup`)**
Dumps the database tables to JSON and mirrors the `songs`/`covers` storage buckets to a second location you control — an S3-compatible bucket (Cloudflare R2 or Backblaze B2). This is the one that protects you even if you forget to click the manual export button.

Setup:

```bash
supabase functions deploy nightly-backup
supabase secrets set \
  BACKUP_S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com \
  BACKUP_S3_BUCKET=gigamusic-backups \
  BACKUP_S3_ACCESS_KEY_ID=... \
  BACKUP_S3_SECRET_ACCESS_KEY=... \
  BACKUP_S3_REGION=auto
```

Then schedule it with `pg_cron` + `pg_net` — see the step-by-step SQL in `supabase/migrations/0002_backup_cron.sql` (it needs your project ref and a service-role key stored in Vault, so it's a manual one-time step rather than part of the migration itself).

**Verify it before you trust it**: run `supabase functions invoke nightly-backup` once after setup and confirm objects land in your R2/B2 bucket under `backups/<date>/`.

## Social sharing

- **X / Facebook** — pre-filled share-intent links, no API needed.
- **Instagram / YouTube** — these platforms don't support posting an arbitrary file from the browser, so the buttons deep-link to each platform's own upload page for a manual attach. True automated posting would need each platform's own OAuth + Content API integration (YouTube Data API v3, Meta Graph API) — a separate project if that's ever wanted.

## Deploying

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com), framework preset "Vite".
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables.
4. Point `gigamusic.org`'s DNS at the Vercel deployment (Vercel's dashboard walks through the A/CNAME records).
5. In Supabase's **Authentication → URL Configuration**, add the production URL as a redirect URL so magic links work there too.

## Scripts

```bash
npm run dev       # local dev server
npm run build     # typecheck + production build
npm run lint      # oxlint
npm run preview   # preview the production build locally
```
