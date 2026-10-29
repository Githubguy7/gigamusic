#!/usr/bin/env node
// Read-only public SEO smoke test. No credentials or production mutations.
const base = (process.env.GIGAMUSIC_SITE_URL || 'https://gigamusic.org').replace(/\/$/, '')
const failures = []

async function get(path) {
  const url = new URL(path, base)
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
    headers: { 'user-agent': 'GigaMusic-SEO-Smoke-Test/1.0' },
  })
  return { response, body: await response.text(), url: url.toString() }
}

async function check(name, path, validate) {
  try {
    const result = await get(path)
    if (!result.response.ok) throw new Error(`HTTP ${result.response.status}`)
    await validate(result)
    console.log(`PASS ${name}: ${result.url}`)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`FAIL ${name}: ${message}`)
    failures.push(name)
    return null
  }
}

await check('Homepage', '/', ({ response, body }) => {
  if (!response.headers.get('content-type')?.includes('text/html')) {
    throw new Error('Expected HTML content type')
  }
  if (!/<title>[^<]*GigaMusic/i.test(body)) throw new Error('Missing GigaMusic page title')
})

await check('robots.txt', '/robots.txt', ({ response, body }) => {
  if (response.headers.get('content-type')?.includes('text/html')) {
    throw new Error('robots.txt returned HTML fallback')
  }
  if (!/User-agent:/i.test(body)) throw new Error('Missing User-agent directive')
  const expected = `${base}/sitemap.xml`
  if (!body.includes(expected)) throw new Error(`Missing Sitemap: ${expected}`)
})

const sitemap = await check('sitemap.xml', '/sitemap.xml', ({ response, body }) => {
  if (!/(?:xml)/i.test(response.headers.get('content-type') || '')) {
    throw new Error('Expected XML content type (possible SPA fallback)')
  }
  if (!/<urlset(?:\s|>)/.test(body) || !/<\/urlset>/.test(body)) {
    throw new Error('Missing sitemap urlset XML root')
  }
  if (!body.includes(`<loc>${base}/</loc>`)) throw new Error('Homepage URL missing from sitemap')
  if (!/<loc>https?:\/\/[^<]+\/song\/[^<]+<\/loc>/.test(body)) {
    throw new Error('No song URLs found in sitemap')
  }
})

if (sitemap) {
  const match = sitemap.body.match(/<loc>(https?:\/\/[^<]+\/song\/[^<]+)<\/loc>/)
  if (match) {
    const songUrl = match[1].replaceAll('&amp;', '&')
    await check('First song deep link', songUrl, ({ response, body }) => {
      if (!response.headers.get('content-type')?.includes('text/html')) {
        throw new Error('Expected HTML page for song deep link')
      }
      if (!/<html\b/i.test(body)) throw new Error('Missing HTML document')
    })
  }
}

if (failures.length) {
  console.error(`\n${failures.length} public SEO check(s) failed: ${failures.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('\nAll public SEO checks passed.')
}
