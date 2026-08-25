// Nightly automated backup.
//
// Dumps the songs/albums/comments tables to JSON and mirrors the `songs` and
// `covers` storage buckets to a second, Michael-controlled location (an
// S3-compatible bucket — Cloudflare R2 or Backblaze B2) so gigamusic.org's
// data can never again disappear along with a single vendor.
//
// Scheduled nightly via Supabase's pg_cron + pg_net (see
// supabase/migrations/0002_backup_cron.sql and README.md "Backups").
// Can also be invoked manually: `supabase functions invoke nightly-backup`.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { AwsClient } from 'npm:aws4fetch@1.3.2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const S3_ENDPOINT = Deno.env.get('BACKUP_S3_ENDPOINT')
const S3_BUCKET = Deno.env.get('BACKUP_S3_BUCKET')
const S3_ACCESS_KEY_ID = Deno.env.get('BACKUP_S3_ACCESS_KEY_ID')
const S3_SECRET_ACCESS_KEY = Deno.env.get('BACKUP_S3_SECRET_ACCESS_KEY')
const S3_REGION = Deno.env.get('BACKUP_S3_REGION') ?? 'auto'

const STORAGE_BUCKETS = ['songs', 'covers']

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Use POST', { status: 405 })
  }

  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          'Missing BACKUP_S3_* secrets. Set them with `supabase secrets set` — see README.md "Backups".',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const s3 = new AwsClient({
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    region: S3_REGION,
    service: 's3',
  })

  const dateStamp = new Date().toISOString().slice(0, 10)
  const backupPrefix = `backups/${dateStamp}`

  try {
    const [albums, songs, comments] = await Promise.all([
      supabase.from('albums').select('*').then(unwrap),
      supabase.from('songs').select('*').then(unwrap),
      supabase.from('comments').select('*').then(unwrap),
    ])

    const metadata = {
      exported_at: new Date().toISOString(),
      albums,
      songs,
      comments,
    }

    await putObject(s3, `${backupPrefix}/metadata.json`, JSON.stringify(metadata, null, 2), 'application/json')

    let filesCopied = 0
    for (const bucket of STORAGE_BUCKETS) {
      filesCopied += await mirrorBucket(supabase, s3, bucket, `${backupPrefix}/storage/${bucket}`)
    }

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: metadata.exported_at,
        counts: { albums: albums.length, songs: songs.length, comments: comments.length },
        files_copied: filesCopied,
      }),
      { headers: { 'content-type': 'application/json' } },
    )
  } catch (error) {
    console.error('nightly-backup failed', error)
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
})

function unwrap<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw error
  return data as T
}

async function putObject(s3: AwsClient, key: string, body: BodyInit, contentType: string) {
  const url = `${S3_ENDPOINT!.replace(/\/$/, '')}/${S3_BUCKET}/${key}`
  const res = await s3.fetch(url, {
    method: 'PUT',
    body,
    headers: { 'content-type': contentType },
  })
  if (!res.ok) {
    throw new Error(`Failed to upload ${key}: ${res.status} ${await res.text()}`)
  }
}

/** Recursively lists and copies every object in a Supabase Storage bucket to the S3 destination. */
async function mirrorBucket(
  supabase: ReturnType<typeof createClient>,
  s3: AwsClient,
  bucket: string,
  destPrefix: string,
  path = '',
): Promise<number> {
  const { data: entries, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 })
  if (error) throw error

  let count = 0
  for (const entry of entries ?? []) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name
    // Folders come back with a null id/metadata; files always carry metadata.
    if (entry.id === null) {
      count += await mirrorBucket(supabase, s3, bucket, destPrefix, entryPath)
      continue
    }

    const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(entryPath)
    if (downloadError) throw downloadError

    await putObject(
      s3,
      `${destPrefix}/${entryPath}`,
      await blob.arrayBuffer(),
      blob.type || 'application/octet-stream',
    )
    count += 1
  }
  return count
}
