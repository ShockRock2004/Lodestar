// What each dated track asks for TODAY, summarised one line per track.
//
// The home tiles only ever showed a track's aggregate pace ("2d behind"); nothing
// surfaced the actual work. This resolves today's calendar slot for every dated
// track and reports how much of it is left plus what it covers — the subjects, the
// chapter, the day's theme — rather than every individual lecture row.
import { getStore, todayISO } from './store.js'
import { PLANS } from './plans.js'
import { SCHEDULE, scheduleInfo, fmtDate } from './schedule.js'
import { ODIN_ITEMS, ODIN_PACE, ODIN_DEFAULT_PACING, packOdinDays } from './odin.js'
import { LLD_DAYS, LLD_TOTAL_DAYS } from './lld.js'
import { SQL_DAYS, SQL_TOTAL_DAYS } from './sql.js'
import { csStats, odinStats, lldStats, sqlStats } from './tracks.js'
import { readingStats } from './progress.js'

// 'pending'  — work left in today's slot
// 'clear'    — today's slot is fully ticked
// 'waiting'  — scheduled to begin on a later date
// 'blocked'  — can't be resolved here (CS Core curriculum not cached yet)
// 'finished' — the whole plan is complete

const CS_SHORT = { 'Operating Systems': 'OS', 'Computer Networks': 'CN', DBMS: 'DBMS' }

const notStarted = (trackId) => {
  const cfg = SCHEDULE[trackId]
  return !!cfg && cfg.start > todayISO()
}

// Distinct values in first-seen order, trimmed to `max` with a "+n" tail.
function facets(values, max = 3) {
  const seen = []
  for (const v of values) if (v && !seen.includes(v)) seen.push(v)
  if (seen.length <= max) return seen.join(' · ')
  return `${seen.slice(0, max).join(' · ')} +${seen.length - max}`
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function csSection() {
  const base = { key: 'cs', name: 'CS Core', to: '/cs-core' }
  const topics = getStore('cs:topics', [])
  const sched = getStore('cs:sched', null)
  if (!topics.length || !sched || !sched.length) {
    return { ...base, behind: 0, state: 'blocked', note: 'Open once to load' }
  }
  const done = getStore('cs:done', {})
  const byId = new Map(topics.map((t) => [t.id, t]))
  const days = sched.map((d) => d.filter((id) => byId.has(id))).filter((d) => d.length)
  if (!days.length) return { ...base, behind: 0, state: 'blocked', note: 'No scheduled days' }

  const { behind } = csStats()
  const { todayN } = scheduleInfo('cs-core', days.length)
  const n = Math.min(todayN, days.length)
  const day = days[n - 1] || []
  const open = day.filter((id) => !done[id])
  return {
    ...base, behind,
    state: open.length ? 'pending' : 'clear',
    dayLabel: `Day ${n} of ${days.length}`,
    open: open.length, total: day.length,
    left: plural(open.length, 'topic'),
    summary: facets(open.map((id) => CS_SHORT[byId.get(id).subject] || byId.get(id).subject)),
  }
}

function sdSection() {
  const base = { key: 'sd', name: 'System Design', to: '/system-design' }
  const s = readingStats('system-design')
  const plan = PLANS['system-design']
  if (s.finished) return { ...base, behind: 0, state: 'finished' }

  const st = getStore('read:system-design', { done: {} })
  const { todayN } = scheduleInfo('system-design', plan.total)
  const day = plan.days[Math.min(todayN, plan.total) - 1]
  const isDone = !!(st.done || {})[day.n]
  return {
    ...base, behind: s.behind,
    state: isDone ? 'clear' : 'pending',
    dayLabel: `Day ${day.n} of ${plan.total}`,
    open: isDone ? 0 : 1, total: 1,
    left: `pp. ${day.from}–${day.to}`,
    summary: facets(day.chapters, 2),
  }
}

function odinSection() {
  const base = { key: 'odin', name: 'Full Stack', to: '/full-stack' }
  const done = getStore('odin:done', {})
  const units = packOdinDays(ODIN_ITEMS, ODIN_PACE)
  const pacing = Math.max(1, Math.min(3, getStore('odin:pacing', ODIN_DEFAULT_PACING) || ODIN_DEFAULT_PACING))
  const totalDays = Math.ceil(units.length / pacing)
  const { behind } = odinStats()
  const { todayN } = scheduleInfo('full-stack', totalDays)
  const n = Math.min(todayN, totalDays)
  const rows = units.slice((n - 1) * pacing, n * pacing).flat()
  const open = rows.filter((r) => !done[r.key])
  return {
    ...base, behind,
    state: open.length ? 'pending' : 'clear',
    dayLabel: `Day ${n} of ${totalDays}`,
    open: open.length, total: rows.length,
    left: plural(open.length, 'lesson'),
    summary: facets(open.map((r) => r.section || r.course), 2),
  }
}

// LLD and SQL share the phase-2 shape: a flat DAYS array of keyed items and a
// `<id>:done` map, so one builder covers both.
function dayPlanSection({ key, name, to, trackId, days, totalDays, stats, storeKey, unit }) {
  const base = { key, name, to }
  if (notStarted(trackId)) {
    return { ...base, behind: 0, state: 'waiting', note: `Begins ${fmtDate(SCHEDULE[trackId].start)}` }
  }
  const done = getStore(storeKey, {})
  const { behind } = stats()
  const { todayN } = scheduleInfo(trackId, totalDays)
  const n = Math.min(todayN, totalDays)
  const day = days[n - 1]
  if (!day) return { ...base, behind, state: 'finished' }
  const open = day.items.filter((it) => !done[it.key])
  return {
    ...base, behind,
    state: open.length ? 'pending' : 'clear',
    dayLabel: `Day ${n} of ${totalDays}`,
    open: open.length, total: day.items.length,
    left: plural(open.length, unit),
    summary: day.title,
  }
}

export function todayAgenda() {
  const sections = [
    csSection(),
    sdSection(),
    odinSection(),
    dayPlanSection({ key: 'lld', name: 'Low Level Design', to: '/lld', trackId: 'lld', days: LLD_DAYS, totalDays: LLD_TOTAL_DAYS, stats: lldStats, storeKey: 'lld:done', unit: 'item' }),
    dayPlanSection({ key: 'sql', name: 'SQL', to: '/sql', trackId: 'sql', days: SQL_DAYS, totalDays: SQL_TOTAL_DAYS, stats: sqlStats, storeKey: 'sql:done', unit: 'problem' }),
  ]
  const pending = sections.filter((s) => s.state === 'pending')
  return {
    sections,
    pending,
    quiet: sections.filter((s) => s.state !== 'pending'),
    openCount: pending.reduce((a, s) => a + s.open, 0),
    behindCount: sections.filter((s) => s.behind > 0).length,
  }
}
