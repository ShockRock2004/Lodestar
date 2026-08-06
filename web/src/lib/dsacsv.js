// Minimal RFC-4180-ish CSV parser (quoted fields, escaped "" quotes, commas & newlines
// inside quotes) plus DSA-specific row mapping and merge-by-slug. No dependency.
import { uid } from './store.js'
import { parseSlug, titleFromSlug, canonicalUrl } from './leetcode.js'

export function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQ = false
  const s = String(text || '').replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\r') { /* handled at \n */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0].trim() === ''))
}

const norm = (s) => (s == null ? '' : String(s)).trim()
const normDiff = (s) => {
  const d = norm(s).toLowerCase()
  if (d[0] === 'e') return 'Easy'
  if (d[0] === 'm') return 'Medium'
  if (d[0] === 'h') return 'Hard'
  return ''
}
const splitTopics = (s) => norm(s).split(/[;|]/).map((t) => t.trim()).filter(Boolean)

// Parse CSV text into DSA drafts. Header required; columns matched by name.
export function parseDsaCsv(text) {
  const rows = parseCsv(text)
  if (!rows.length) return { drafts: [], skipped: 0 }
  const header = rows[0].map((h) => norm(h).toLowerCase())
  const idx = (names) => { for (const n of names) { const i = header.indexOf(n); if (i >= 0) return i } return -1 }
  const iUrl = idx(['url', 'link']), iDiff = idx(['difficulty', 'level'])
  const iTop = idx(['topic', 'topics', 'tags']), iDate = idx(['date', 'target_date', 'target'])
  const iStat = idx(['status', 'state']), iNote = idx(['notes', 'note'])
  const iTitle = idx(['title', 'name', 'question'])
  const drafts = []
  let skipped = 0
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const rawUrl = iUrl >= 0 ? norm(cells[iUrl]) : ''
    const slug = parseSlug(rawUrl)
    if (!slug) { skipped++; continue }
    const status = iStat >= 0 && /solv|done|1|yes/i.test(norm(cells[iStat])) ? 'solved' : 'todo'
    drafts.push({
      slug,
      url: /^https?:/i.test(rawUrl) ? rawUrl : canonicalUrl(slug),
      title: iTitle >= 0 && norm(cells[iTitle]) ? norm(cells[iTitle]) : titleFromSlug(slug),
      difficulty: iDiff >= 0 ? normDiff(cells[iDiff]) : '',
      topics: iTop >= 0 ? splitTopics(cells[iTop]) : [],
      target_date: iDate >= 0 && norm(cells[iDate]) ? norm(cells[iDate]) : null,
      status,
      notes: iNote >= 0 ? norm(cells[iNote]) : '',
    })
  }
  return { drafts, skipped }
}

// Merge drafts into an existing problem list by slug. Preserves manual notes (appends CSV
// note on a new line if different). Returns only the { changed } rows to upsert + counts.
export function mergeDrafts(existing, drafts, plan = 'My problems') {
  const bySlug = new Map(existing.filter((x) => x.slug && (x.plan || 'My problems') === plan).map((x) => [x.slug, x]))
  const nowIso = new Date().toISOString()
  const changed = []
  let added = 0, updated = 0
  drafts.forEach((d) => {
    const cur = bySlug.get(d.slug)
    if (!cur) {
      const rec = {
        id: uid(), slug: d.slug, url: d.url, title: d.title, difficulty: d.difficulty,
        topics: d.topics, notes: d.notes || '', status: d.status,
        score: d.status === 'solved' ? 4 : null, target_date: d.target_date, source: 'csv', plan,
        created_at: nowIso, updated_at: nowIso, solved_at: d.status === 'solved' ? nowIso : null,
      }
      changed.push(rec); bySlug.set(d.slug, rec); added++
      return
    }
    const patch = {}
    if (!cur.title && d.title) patch.title = d.title
    if (!cur.url && d.url) patch.url = d.url
    if (!cur.difficulty && d.difficulty) patch.difficulty = d.difficulty
    if ((!cur.topics || !cur.topics.length) && d.topics.length) patch.topics = d.topics
    if (!cur.target_date && d.target_date) patch.target_date = d.target_date
    if (d.status === 'solved' && cur.status !== 'solved') {
      patch.status = 'solved'; patch.solved_at = nowIso; if (cur.score == null) patch.score = 4
    }
    if (d.notes) {
      const curN = (cur.notes || '').trim()
      if (!curN) patch.notes = d.notes
      else if (!curN.includes(d.notes)) patch.notes = curN + '\n' + d.notes
    }
    if (Object.keys(patch).length) {
      patch.updated_at = nowIso
      const merged = { ...cur, ...patch }
      changed.push(merged); bySlug.set(d.slug, merged); updated++
    }
  })
  return { changed, added, updated }
}
