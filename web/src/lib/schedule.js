// Timed schedule for the date-based tracks, aligned to the targets board:
//
//   Phase 1 · Sep 11 – Oct 10  DSA sheet, CS Core, System Design @ 10 pp/day,
//                              2 Odin units/day
//   Phase 2 · Oct 11 – Nov 10  LeetCode 150, LLD, SQL, 2 Odin units/day
//   Phase 3 · Nov 11 – Nov 25  revision, LeetCode 75, mock interviews
//
// Day 1 lands on `start`; each subsequent scheduled day is the next calendar date,
// skipping SCHEDULE_SKIPS (days the user isn't free). `weekendDouble` packs two days
// of work onto each Sat/Sun. `datedDays` caps how many days get a date at all —
// everything past it belongs to the plan but not to the calendar.
import { todayISO } from './store.js'

export const SCHEDULE_SKIPS = ['2026-08-27', '2026-08-31', '2026-09-02']
const SKIP = new Set(SCHEDULE_SKIPS)

// Only Volume 1 of System Design is in the current plan: 27 days at 10 pp/day.
// Volume 2's days exist in plans.js but are deliberately left undated.
export const SD_DATED_DAYS = 27

// Keyed by the ids used across the app (reading planId 'system-design', plus our own
// track ids). Every track's DAY 1 falls on its `start` date — no backdating.
// CS Core, System Design and Full Stack all begin day 1 on Sep 11; System Design's
// day 27 (end of Volume 1) is Oct 7. LLD and SQL open phase 2 on Oct 11.
export const SCHEDULE = {
  'system-design': { start: '2026-09-11', weekendDouble: false, datedDays: SD_DATED_DAYS },
  'cs-core': { start: '2026-09-11', weekendDouble: false },
  'full-stack': { start: '2026-09-11', weekendDouble: false },
  'lld': { start: '2026-10-11', weekendDouble: false },
  'sql': { start: '2026-10-11', weekendDouble: false },
}

export const isScheduled = (trackId) => !!SCHEDULE[trackId]

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// day-index (1-based) -> ISO date. Honors skips and weekend-doubling.
// A doubled weekend date appears twice (two work-days land on it).
export function scheduleDates(trackId, count) {
  const cfg = SCHEDULE[trackId]
  if (!cfg || !count || count < 1) return []
  // Days beyond `datedDays` are part of the plan but not the calendar, so they get
  // no date — and therefore can never be "due", never count toward behind/ahead.
  if (cfg.datedDays != null) count = Math.min(count, cfg.datedDays)
  const [y, m, d] = cfg.start.split('-').map(Number)
  const dates = []
  let cur = new Date(y, m - 1, d)
  let guard = 0
  while (dates.length < count && guard++ < 100000) {
    const k = iso(cur)
    if (!SKIP.has(k)) {
      const dow = cur.getDay() // 0 Sun … 6 Sat
      const slots = cfg.weekendDouble && (dow === 0 || dow === 6) ? 2 : 1
      for (let s = 0; s < slots && dates.length < count; s++) dates.push(k)
    }
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1)
  }
  return dates
}

// Everything a page needs: the date list, how many days are due by today (for pace),
// which day-index the user is on "today", and the finish date.
export function scheduleInfo(trackId, count, today = todayISO()) {
  const dates = scheduleDates(trackId, count)
  let due = 0
  for (const k of dates) if (k <= today) due++
  const todaySet = new Set()
  dates.forEach((k, i) => { if (k === today) todaySet.add(i + 1) })
  // focus day: the (last) slot scheduled today; else the next upcoming slot; else the last day.
  let todayN = 0
  dates.forEach((k, i) => { if (k === today) todayN = i + 1 })
  if (!todayN) {
    const up = dates.findIndex((k) => k > today)
    todayN = up === -1 ? dates.length : up + 1
  }
  return { dates, due, todayN, todaySet, finishISO: dates[dates.length - 1] || null }
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function fmtDate(isoStr) {
  if (!isoStr) return ''
  const [, m, d] = isoStr.split('-').map(Number)
  return `${MON[m - 1]} ${d}`
}
export function fmtDateFull(isoStr) {
  if (!isoStr) return ''
  const [y, m, d] = isoStr.split('-').map(Number)
  return `${DOW[new Date(y, m - 1, d).getDay()]}, ${MON[m - 1]} ${d}`
}
