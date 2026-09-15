// Snapshot of everything the reviewer is allowed to reason about. Built from the
// stores directly (no hooks) so it can be assembled on demand, and kept to plain
// numbers so the model is never asked to do arithmetic.
import { getStore, todayISO } from './store.js'
import { readingStats, activityLast7, currentStreak, dsaSolvedISO } from './progress.js'
import { allTracks, overallPct } from './tracks.js'
import { SCHEDULE, fmtDate } from './schedule.js'
import { LLD_TOTAL_DAYS } from './lld.js'
import { SQL_TOTAL_DAYS } from './sql.js'
import { getChecklists, checklistSummary, progressOf } from './checklists.js'
import { fmtRange12 } from './timephrase.js'
import { daysToPlacement } from './ai.js'

// A scheduled track whose start date is still in the future has not begun. Its 0%
// is the plan working as intended, not a failure, so it must never be scored or
// criticised — LLD and SQL do not start until 2026-10-11.
export const notStartedYet = (trackId) => {
  const cfg = SCHEDULE[trackId]
  return !!cfg && cfg.start > todayISO()
}

const todaysDsa = () => getStore('col:dsa', []).find((x) => dsaSolvedISO(x) === todayISO())

export function buildTracks() {
  const t = allTracks()
  const sd = t.sd
  const dsaToday = todaysDsa()
  const pace = (s) => (s.behind ? `${s.behind}d behind` : s.ahead ? `${s.ahead}d ahead` : 'on track')

  return [
    { name: 'DSA', pct: null, state: dsaToday ? `today's problem logged (${dsaToday.title}${dsaToday.score ? `, ${dsaToday.score}/5` : ''})` : "today's problem NOT logged", pace: 'daily practice', behind: 0 },
    t.cs.loaded
      ? { name: 'CS Core', pct: t.cs.pct, state: `${t.cs.done} of ${t.cs.total} topics · ${t.cs.doneDays} of ${t.cs.days} days`, pace: pace(t.cs), behind: t.cs.behind }
      : { name: 'CS Core', pct: null, state: 'curriculum not loaded in this browser yet', pace: 'unknown', behind: 0, pending: true },
    { name: 'System Design', pct: sd.pct, state: `day ${Math.min(sd.currentDay, sd.total)} of ${sd.total}`, pace: pace(sd), behind: sd.behind || 0 },
    { name: 'Full Stack', pct: t.odin.pct, state: `${t.odin.done} of ${t.odin.total} items · ${t.odin.doneDays} of ${t.odin.days} days`, pace: pace(t.odin), behind: t.odin.behind },
    notStartedYet('lld')
      ? { name: 'Low Level Design', pct: null, state: `NOT STARTED — scheduled to begin ${fmtDate(SCHEDULE.lld.start)}`, pace: 'not due to have begun', behind: 0, pending: true }
      : { name: 'Low Level Design', pct: t.lld.pct, state: `${t.lld.doneDays} of ${LLD_TOTAL_DAYS} days`, pace: pace(t.lld), behind: t.lld.behind },
    notStartedYet('sql')
      ? { name: 'SQL', pct: null, state: `NOT STARTED — scheduled to begin ${fmtDate(SCHEDULE.sql.start)}`, pace: 'not due to have begun', behind: 0, pending: true }
      : { name: 'SQL', pct: t.sql.pct, state: `${t.sql.doneDays} of ${SQL_TOTAL_DAYS} days · ${t.sql.done} of ${t.sql.total} items`, pace: pace(t.sql), behind: t.sql.behind },
  ]
}

export function buildAiContext() {
  const tracks = buildTracks()
  const week = activityLast7()
  const lists = getChecklists()
  const sum = checklistSummary(lists)

  const sd = readingStats('system-design')
  const dsaToday = todaysDsa()
  const doneToday = (planId) => {
    const st = getStore(`read:${planId}`, { done: {} })
    return Object.values(st.done || {}).some((ts) => String(ts).slice(0, 10) === todayISO())
  }
  const targets = [
    doneToday('system-design') || sd.finished,
    !!dsaToday,
  ]

  const overall = overallPct()

  const checklistDetail = lists.slice(0, 8).map((l) => {
    const p = progressOf(l)
    return {
      title: l.title,
      urgent: l.items.filter((i) => !i.done && i.urgent).length,
      done: p.done,
      total: p.total,
      openTimed: l.items.filter((i) => !i.done && i.start != null)
        .sort((a, b) => a.start - b.start)
        .slice(0, 5)
        .map((i) => `${fmtRange12(i.start, i.end)} ${i.text}${i.urgent ? ' [urgent]' : ''}`),
    }
  })

  return {
    today: todayISO(),
    daysLeft: daysToPlacement(),
    overall,
    streak: currentStreak(),
    week: { total: week.total, raw: week.raw },
    todayDone: targets.filter(Boolean).length,
    todayTotal: targets.length,
    tracks,
    checklists: sum,
    checklistDetail,
  }
}

// The deterministic figures the panel prints itself — never model-generated.
export function localStats(ctx) {
  const behind = ctx.tracks.filter((t) => t.behind > 0)
  return {
    daysLeft: ctx.daysLeft,
    overall: ctx.overall,
    streak: ctx.streak,
    week: ctx.week.total,
    behindCount: behind.length,
    worstBehind: behind.sort((a, b) => b.behind - a.behind)[0] || null,
    openObjectives: ctx.checklists.openItems,
  }
}
