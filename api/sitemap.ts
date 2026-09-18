import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://gigamusic.org'
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://orkobwtacpjdferhzqtq.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iwNYOnqJerbxAh0gXpJHkQ_1ITKDq3v'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export default async function handler(_req: unknown, res: any) {
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Unable to build GigaMusic sitemap:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Unable to generate sitemap')
    return
  }

  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...(songs ?? []).map((song) => {
      const loc = xmlEscape(`${SITE_URL}/song/${song.id}`)
      const lastmod = song.updated_at ? `\n    <lastmod>${xmlEscape(new Date(song.updated_at).toISOString())}</lastmod>` : ''
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    }),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')
  res.end(xml)
}
