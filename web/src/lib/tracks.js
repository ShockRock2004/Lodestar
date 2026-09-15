// One derivation of every track's numbers, straight from the raw stores.
//
// The pages used to each compute their own progress and then cache a summary under
// `cs:stats` / `odin:stats` / `lld:stats` / `sql:stats`. Home and the AI review read
// those caches, so a track that had never been opened in this browser reported 0%,
// and a track opened in another tab reported stale figures. Everything derives from
// the same done-maps here instead, so every surface agrees by construction.
import { getStore } from './store.js'
import { readingStats, dsaSolvedISO } from './progress.js'
import { scheduleInfo } from './schedule.js'
import { packInterleaved, makeRowMins, DEFAULT_PACE } from './csplan.js'
import { ODIN_ITEMS, ODIN_PACE, ODIN_DEFAULT_PACING, packOdinDays, odinPct, odinPlanProgress } from './odin.js'
import { LLD_TOTAL_DAYS, lldPct, doneDaysCount as lldDoneDays } from './lld.js'
import { SQL_TOTAL_DAYS, sqlPct, doneDaysCount as sqlDoneDays } from './sql.js'

const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0)
const paceOf = (doneDays, due, complete) => {
  const behind = Math.max(0, due - doneDays)
  const ahead = Math.max(0, doneDays - due)
  return {
    behind, ahead,
    label: complete ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track',
  }
}

// ── DSA ──
export { dsaSolvedISO }

export function dsaStats(items = getStore('col:dsa', [])) {
  const list = Array.isArray(items) ? items : []
  const solved = list.filter((x) => (x.status || 'solved') === 'solved')
  return { done: solved.length, total: list.length, todo: list.length - solved.length, pct: pct(solved.length, list.length) }
}

// ── CS Core ──
// `cs:topics` is the curriculum snapshot written when the page loads from Supabase;
// `cs:sched` is the user's paced day arrangement. Both are needed to know how many
// *days* are done, which is what the calendar schedule measures pace against.
export function csStats() {
  const topics = getStore('cs:topics', [])
  const done = getStore('cs:done', {})
  const total = topics.length
  const doneCount = topics.filter((t) => done[t.id]).length
  const sched = getStore('cs:sched', null)
  const loaded = total > 0
  if (!loaded || !sched || !sched.length) {
    return { done: doneCount, total, pct: pct(doneCount, total), loaded, days: 0, doneDays: 0, behind: 0, ahead: 0, paceLabel: loaded ? 'On track' : 'Not loaded' }
  }
  const live = new Set(topics.map((t) => t.id))
  const days = sched.map((d) => d.filter((id) => live.has(id))).filter((d) => d.length)
  const doneDays = days.filter((d) => d.every((id) => done[id])).length
  const due = scheduleInfo('cs-core', days.length).due
  const p = paceOf(doneDays, due, total > 0 && doneCount === total)
  return { done: doneCount, total, pct: pct(doneCount, total), loaded, days: days.length, doneDays, ...p, paceLabel: p.label }
}

// The number of curriculum days CS Core would produce at a given pace, without
// needing the page mounted. Used only as a fallback before `cs:sched` exists.
export function csDayCount(pace = getStore('cs:pace', DEFAULT_PACE)) {
  const topics = getStore('cs:topics', [])
  if (!topics.length) return 0
  const rows = topics.map((t) => ({ id: t.id, subject: t.subject, chapter: t.chapter, topic_name: t.topics, video_urls: '' }))
  return packInterleaved(rows, pace, makeRowMins(rows)).length
}

// ── Full Stack (Odin) ──
// Units are packed once at the canonical pace; the user's `odin:pacing` (1-3 units
// per calendar day) then folds those units into plan-days. A plan-day only counts as
// done when EVERY unit inside it is done — see odinPlanProgress.
export function odinStats() {
  const done = getStore('odin:done', {})
  const units = packOdinDays(ODIN_ITEMS, ODIN_PACE)
  const p = Math.max(1, Math.min(3, getStore('odin:pacing', ODIN_DEFAULT_PACING) || ODIN_DEFAULT_PACING))
  const { days, doneDays } = odinPlanProgress(units, p, done)
  const doneUnits = units.filter((rows) => rows.length > 0 && rows.every((r) => done[r.key])).length
  const { done: doneItems, total } = odinPct(done)
  const due = scheduleInfo('full-stack', days).due
  const pc = paceOf(doneDays, due, doneItems >= total)
  return {
    done: doneItems, total, pct: pct(doneItems, total),
    units: units.length, doneUnits, days, doneDays,
    ...pc, paceLabel: pc.label,
  }
}

// ── Low Level Design ──
export function lldStats() {
  const done = getStore('lld:done', {})
  const { doneItems, totalItems } = lldPct(done)
  const doneDays = lldDoneDays(done)
  const due = scheduleInfo('lld', LLD_TOTAL_DAYS).due
  const p = paceOf(doneDays, due, doneDays >= LLD_TOTAL_DAYS)
  return { done: doneItems, total: totalItems, pct: pct(doneItems, totalItems), days: LLD_TOTAL_DAYS, doneDays, ...p, paceLabel: p.label }
}

// ── SQL ── runs alongside LLD in phase 2 (from 2026-10-11), so it is now dated.
export function sqlStats() {
  const done = getStore('sql:done', {})
  const { doneItems, totalItems } = sqlPct(done)
  const doneDays = sqlDoneDays(done)
  const due = scheduleInfo('sql', SQL_TOTAL_DAYS).due
  const p = paceOf(doneDays, due, doneDays >= SQL_TOTAL_DAYS)
  return { done: doneItems, total: totalItems, pct: pct(doneItems, totalItems), days: SQL_TOTAL_DAYS, doneDays, ...p, paceLabel: p.label }
}

// Every track in one call, in display order. `pct: null` means "has no percentage"
// (DSA is open-ended practice) and is excluded from the overall average.
export function allTracks() {
  const sd = readingStats('system-design')
  return {
    dsa: dsaStats(),
    cs: csStats(),
    sd,
    odin: odinStats(),
    lld: lldStats(),
    sql: sqlStats(),
  }
}

// Overall completion = the mean of the tracks that have a percentage.
export function overallPct(t = allTracks()) {
  const parts = [t.cs.loaded ? t.cs.pct : null, t.sd.pct, t.odin.pct, t.lld.pct, t.sql.pct].filter((p) => p != null)
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0
}
