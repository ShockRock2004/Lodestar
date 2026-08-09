// Snapshot of everything the reviewer is allowed to reason about. Built from the
// stores directly (no hooks) so it can be assembled on demand, and kept to plain
// numbers so the model is never asked to do arithmetic.
import { getStore, todayISO } from './store.js'
import { readingStats, activityLast7, activityRange } from './progress.js'
import { scheduleInfo, SCHEDULE, fmtDate } from './schedule.js'
import { LLD_TOTAL_DAYS } from './lld.js'
import { getChecklists, checklistSummary, progressOf } from './checklists.js'
import { fmtRange12 } from './timephrase.js'
import { daysToPlacement } from './ai.js'

function streak() {
  const range = activityRange(120)
  let s = 0, i = range.length - 1
  if (range[i] && range[i].count === 0) i--
  for (; i >= 0 && range[i] && range[i].count > 0; i--) s++
  return s
}

// Tracks the reviewer must ignore. ML · Quant is not being studied, so counting it
// would drag every average down and invite criticism about a track that was never
// planned. Its home card and its own page are untouched — this only scopes the review.
export const AI_EXCLUDED = new Set(['ML · Quant'])

// A scheduled track whose start date is still in the future has not begun. Its 0%
// is the plan working as intended, not a failure, so it must never be scored or
// criticised — Low Level Design does not start until 2026-10-01.
export const notStartedYet = (trackId) => {
  const cfg = SCHEDULE[trackId]
  return !!cfg && cfg.start > todayISO()
}

export function buildTracks() {
  const sd = readingStats('system-design')
  const ma = readingStats('math')
  const ho = readingStats('handson')
  const cs = getStore('cs:stats', { done: 0, total: 46, pct: 0 })
  const odin = getStore('odin:stats', { done: 0, total: 197, pct: 0 })
  const lld = getStore('lld:stats', { done: 0, total: 0, pct: 0, doneDays: 0 })
  const lldBehind = Math.max(0, scheduleInfo('lld', LLD_TOTAL_DAYS).due - (lld.doneDays || 0))
  const dsaToday = getStore('col:dsa', []).find((x) => x.date === todayISO())
  const mlBehind = Math.max(ma.behind || 0, ho.behind || 0)

  return [
    { name: 'DSA', pct: null, state: dsaToday ? `today's problem logged (${dsaToday.title}, ${dsaToday.score}/5)` : "today's problem NOT logged", pace: 'daily practice', behind: 0 },
    { name: 'ML · Quant', pct: Math.round((ma.pct + ho.pct) / 2), state: `Math day ${ma.currentDay}/${ma.total}, Hands-On day ${ho.currentDay}/${ho.total}`, pace: mlBehind ? `${mlBehind}d behind` : 'on track', behind: mlBehind },
    { name: 'CS Core', pct: cs.pct, state: `${cs.done} of ${cs.total || 46} topics`, pace: 'self-paced', behind: 0 },
    { name: 'System Design', pct: sd.pct, state: `day ${sd.currentDay} of ${sd.total}`, pace: sd.behind ? `${sd.behind}d behind` : 'on track', behind: sd.behind || 0 },
    { name: 'Full Stack', pct: odin.pct, state: `${odin.done} of ${odin.total} items`, pace: '4-month plan', behind: 0 },
    notStartedYet('lld')
      ? { name: 'Low Level Design', pct: null, state: `NOT STARTED — scheduled to begin ${fmtDate(SCHEDULE.lld.start)}`, pace: 'not due to have begun', behind: 0, pending: true }
      : { name: 'Low Level Design', pct: lld.pct, state: `${lld.doneDays || 0} of ${LLD_TOTAL_DAYS} days`, pace: lldBehind ? `${lldBehind}d behind` : 'on track', behind: lldBehind },
  ]
}

export function buildAiContext() {
  const tracks = buildTracks().filter((t) => !AI_EXCLUDED.has(t.name))
  const week = activityLast7()
  const lists = getChecklists()
  const sum = checklistSummary(lists)

  const sd = readingStats('system-design')
  const dsaToday = getStore('col:dsa', []).find((x) => x.date === todayISO())
  const doneToday = (planId) => {
    const st = getStore(`read:${planId}`, { done: {} })
    return Object.values(st.done || {}).some((ts) => String(ts).slice(0, 10) === todayISO())
  }
  // 'math' and 'handson' are the ML · Quant reading plans, so they are left out here
  // for the same reason the track is: they are not part of the plan being reviewed.
  const targets = [
    doneToday('system-design') || sd.finished,
    !!dsaToday,
  ]

  const pcts = tracks.map((t) => t.pct).filter((p) => p != null)
  const overall = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0

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
    streak: streak(),
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
