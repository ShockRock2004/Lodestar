// Snapshot of everything the reviewer is allowed to reason about. Built from the
// stores directly (no hooks) so it can be assembled on demand, and kept to plain
// numbers so the model is never asked to do arithmetic.
import { getStore, todayISO } from './store.js'
import { readingStats, activityLast7, activityRange } from './progress.js'
import { scheduleInfo } from './schedule.js'
import { LLD_TOTAL_DAYS } from './lld.js'
import { getChecklists, checklistSummary, progressOf } from './checklists.js'
import { fmtRange } from './timephrase.js'
import { daysToPlacement } from './ai.js'

function streak() {
  const range = activityRange(120)
  let s = 0, i = range.length - 1
  if (range[i] && range[i].count === 0) i--
  for (; i >= 0 && range[i] && range[i].count > 0; i--) s++
  return s
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
    { name: 'Low Level Design', pct: lld.pct, state: `${lld.doneDays || 0} of ${LLD_TOTAL_DAYS} days`, pace: lldBehind ? `${lldBehind}d behind` : 'on track', behind: lldBehind },
  ]
}

export function buildAiContext() {
  const tracks = buildTracks()
  const week = activityLast7()
  const lists = getChecklists()
  const sum = checklistSummary(lists)

  const sd = readingStats('system-design')
  const ma = readingStats('math')
  const ho = readingStats('handson')
  const dsaToday = getStore('col:dsa', []).find((x) => x.date === todayISO())
  const doneToday = (planId) => {
    const st = getStore(`read:${planId}`, { done: {} })
    return Object.values(st.done || {}).some((ts) => String(ts).slice(0, 10) === todayISO())
  }
  const targets = [
    doneToday('system-design') || sd.finished,
    doneToday('math') || ma.finished,
    doneToday('handson') || ho.finished,
    !!dsaToday,
  ]

  const pcts = tracks.map((t) => t.pct).filter((p) => p != null)
  const overall = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0

  const checklistDetail = lists.slice(0, 8).map((l) => {
    const p = progressOf(l)
    return {
      title: l.title,
      urgency: l.urgency,
      done: p.done,
      total: p.total,
      openTimed: l.items.filter((i) => !i.done && i.start != null)
        .sort((a, b) => a.start - b.start)
        .slice(0, 5)
        .map((i) => `${fmtRange(i.start, i.end)} ${i.text}`),
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
