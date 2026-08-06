import { VIDEO_DURATIONS } from './csdurations'

export const PACE_OPTIONS = [30, 60, 90]
export const DEFAULT_PACE = 60
export const WEEK_SIZE = 7
export const PACE_LABEL = { 30: '0.5 hr', 60: '1 hr', 90: '1.5 hr' }

export function ytid(u) {
  if (!u) return null
  let m = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/)
  if (m) return m[1]
  m = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/)
  if (m) return m[1]
  m = u.match(/\/embed\/([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}

// Real minutes for a row: sum of its video durations from the map.
export function realMins(row) {
  const dbv = Number(row.duration_mins)
  if (dbv > 0) return dbv
  const urls = (row.video_urls || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  let sum = 0
  for (const u of urls) {
    const id = ytid(u)
    if (id && VIDEO_DURATIONS[id] != null) sum += VIDEO_DURATIONS[id]
  }
  return sum
}

// Estimate per-row minutes when durations are missing.
export function estPerRow(rows) {
  const origDays = new Set(rows.map((r) => r.day || r.chapter)).size || 1
  return Math.max(6, Math.floor(DEFAULT_PACE / Math.max(1, rows.length / origDays)))
}
export function makeRowMins(rows) {
  const est = estPerRow(rows)
  return (t) => { const r = realMins(t); return r > 0 ? r : est }
}

// Pack rows (in order) into days landing as close to `budget` minutes as possible.
export function packDays(rows, budget, rowMins) {
  const days = []
  let cur = [], m = 0
  for (const t of rows) {
    const d = rowMins(t)
    if (cur.length && Math.abs(m - budget) <= Math.abs(m + d - budget)) {
      days.push(cur); cur = []; m = 0
    }
    cur.push(t); m += d
  }
  if (cur.length) days.push(cur)
  return days
}

// Pack so EACH day draws a chunk from every remaining subject (interleaved),
// keeping each day ~`budget` minutes. A day therefore covers OS + CN + DBMS
// until a subject runs out, after which the rest split the budget.
export function packInterleaved(rows, budget, rowMins) {
  const bySubj = new Map()
  for (const r of rows) {
    if (!bySubj.has(r.subject)) bySubj.set(r.subject, [])
    bySubj.get(r.subject).push(r)
  }
  const queues = [...bySubj.values()].map((items) => ({ items, i: 0 }))
  const remaining = () => queues.filter((q) => q.i < q.items.length)
  const days = []
  let turn = 0, guard = 0
  // Fill each day to ~`budget` minutes, taking one row at a time round-robin across
  // subjects (global `turn` so subjects rotate fairly). Pace therefore scales the
  // NUMBER of rows/day: a 90-min day packs ~3x the rows of a 30-min day.
  while (remaining().length && guard++ < 20000) {
    const day = []
    let m = 0
    while (remaining().length) {
      const active = remaining()
      const q = active[turn % active.length]
      const d = rowMins(q.items[q.i])
      if (m > 0 && Math.abs(m - budget) <= Math.abs(m + d - budget)) break
      day.push(q.items[q.i]); q.i += 1; m += d; turn += 1
    }
    if (!day.length) { const q = remaining()[0]; day.push(q.items[q.i]); q.i += 1 }
    days.push(day)
  }
  return days
}

export const dayMinutes = (rows, rowMins) => rows.reduce((s, t) => s + rowMins(t), 0)
export const dayDone = (rows, isDone) => rows.length > 0 && rows.every((t) => isDone(t.id))
export function currentDayIndex(days, isDone) {
  const i = days.findIndex((rows) => !dayDone(rows, isDone))
  return i === -1 ? days.length : i + 1
}
export function fmtDuration(mins) {
  mins = Math.round(mins)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
