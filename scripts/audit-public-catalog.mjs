#!/usr/bin/env node
// Read-only audit of the publicly readable GigaMusic song catalog.
// No credentials beyond the existing publishable Supabase key; no database writes.
import { appendFileSync } from 'node:fs'

const base = (process.env.GIGAMUSIC_SUPABASE_URL || 'https://orkobwtacpjdferhzqtq.supabase.co').replace(/\/$/, '')
const key = process.env.GIGAMUSIC_SUPABASE_ANON_KEY || 'sb_publishable_iwNYOnqJerbxAh0gXpJHkQ_1ITKDq3v'
const site = 'https://gigamusic.org'
const pageSize = 500
const maxRows = 5000

function normalize(value) {
  return String(value || '').normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}
function clean(value) {
  return String(value || '').replace(/[\r\n|]/g, ' ').trim()
}
function distance(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 4
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    previous = current
  }
  return previous[b.length]
}
async function fetchSongs() {
  const rows = []
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const url = new URL(base + '/rest/v1/songs')
    url.searchParams.set('select', 'id,title,artist_name,genre,artwork_url')
    url.searchParams.set('order', 'created_at.desc')
    url.searchParams.set('limit', String(pageSize))
    url.searchParams.set('offset', String(offset))
    const response = await fetch(url, {
      headers: { apikey: key, Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) throw new Error('Supabase public read failed: HTTP ' + response.status)
    const batch = await response.json()
    if (!Array.isArray(batch)) throw new Error('Unexpected catalog response')
    rows.push(...batch)
    if (batch.length < pageSize) break
  }
  return rows
}

const issues = new Map([
  ['Unknown/missing artist', []],
  ['Filename-style title', []],
  ['Missing song artwork (check album cover)', []],
  ['Missing genre', []],
  ['Possible duplicate or typo', []],
])
function flag(category, song, note = '') {
  const label = clean(song.title) + ' — ' + clean(song.artist_name)
  issues.get(category).push('[' + label + '](' + site + '/song/' + encodeURIComponent(song.id) + ')' + (note ? ' (' + note + ')' : ''))
}
function audit(songs) {
  const byArtist = new Map()
  for (const song of songs) {
    const artist = normalize(song.artist_name)
    if (!artist || artist === 'unknown artist') flag('Unknown/missing artist', song)
    if (/\.(mp3|wav|flac)$/i.test(song.title || '') || /_/.test(song.title || '')) {
      flag('Filename-style title', song)
    }
    if (!song.artwork_url) flag('Missing song artwork (check album cover)', song)
    if (!String(song.genre || '').trim()) flag('Missing genre', song)
    if (!byArtist.has(artist)) byArtist.set(artist, [])
    byArtist.get(artist).push(song)
  }
  for (const group of byArtist.values()) {
    const sorted = group.map(song => ({ song, title: normalize(song.title) }))
      .sort((a, b) => a.title.localeCompare(b.title))
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < Math.min(sorted.length, i + 5); j++) {
        const a = sorted[i], b = sorted[j]
        if (!a.title || !b.title || a.title.length < 12 || b.title.length < 12) continue
        if (a.title.slice(0, 6) !== b.title.slice(0, 6)) continue
        const d = distance(a.title, b.title)
        if (d <= 3) flag('Possible duplicate or typo', b.song,
          d === 0 ? 'same title as ' + clean(a.song.title) : 'similar to ' + clean(a.song.title))
      }
    }
  }
}
function report(songs) {
  const lines = ['# GigaMusic public catalog audit', '',
    'Publicly readable songs checked: **' + songs.length + '**. This is a review report, not an automatic edit.', '']
  for (const [category, entries] of issues) {
    lines.push('## ' + category + ': ' + entries.length)
    for (const entry of entries.slice(0, 12)) lines.push('- ' + entry)
    if (entries.length > 12) lines.push('- …and ' + (entries.length - 12) + ' more')
    lines.push('')
  }
  if (songs.length >= maxRows) lines.push('**Warning:** Reached the ' + maxRows + '-song audit limit; expand pagination.')
  lines.push('Artist/title similarities may be legitimate alternate recordings. Confirm before editing or deleting.')
  const summary = lines.join('\n') + '\n'
  console.log(summary)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
}

try {
  const songs = await fetchSongs()
  audit(songs)
  report(songs)
} catch (error) {
  console.error('Catalog audit failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
