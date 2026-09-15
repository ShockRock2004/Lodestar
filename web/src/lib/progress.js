import { useCallback } from 'react'
import { getStore, setStore, useStore, uid, todayISO } from './store.js'
import { PLANS } from './plans.js'
import { isScheduled, scheduleInfo } from './schedule.js'

const readKey = (planId) => `read:${planId}`

// Every day-keyed completion store in the app. Each is `{ <key>: <ISO timestamp> }`,
// so one shape serves the streak, the weekly chart, the heatmap and the day drill-down.
// Keeping the list in one place is what stops a new track (SQL was the last one) from
// silently going missing from half the graphs.
const DONE_STORES = [
  { key: 'read:system-design', section: 'SD', nested: true },
  { key: 'cs:done', section: 'CS' },
  { key: 'odin:done', section: 'FS' },
  { key: 'lld:done', section: 'LLD' },
  { key: 'sql:done', section: 'SQL' },
]

// `nested` stores keep their map under `.done`; the rest are the map itself.
const doneMap = (s) => {
  const v = getStore(s.key, s.nested ? { done: {} } : {})
  return (s.nested ? (v && v.done) : v) || {}
}

// A DSA problem counts on the day it was solved. The collection stores
// { status, solved_at }; rows written before the schema change only had `date`,
// so that legacy field is still honoured.
export const dsaSolvedISO = (x) => {
  if (!x) return null
  if (x.status && x.status !== 'solved') return null
  const raw = x.solved_at || x.date || x.updated_at || x.created_at || x.created || null
  if (!raw) return null
  const s = typeof raw === 'number' ? new Date(raw).toISOString() : String(raw)
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null
}
const dsaSolvedDates = () => getStore('col:dsa', []).map(dsaSolvedISO).filter(Boolean)

function earliestActivityISO() {
  let min = null
  const consider = (d) => { if (d && (!min || d < min)) min = d }
  DONE_STORES.forEach((s) => {
    Object.values(doneMap(s)).forEach((ts) => { if (typeof ts === 'string') consider(ts.slice(0, 10)) })
  })
  dsaSolvedDates().forEach(consider)
  return min
}
export function planStart() {
  let s = getStore('plan:start', null)
  // Anchor pace to the user's FIRST recorded activity, not the day the app first loaded —
  // otherwise a returning user with prior progress shows a bogus "Nd ahead".
  if (!s) { s = earliestActivityISO() || todayISO(); setStore('plan:start', s) }
  return s
}
export function migrateLegacy() {
  try {
    if (getStore('migrated:v1', false)) return
    const cs = getStore('cs:done', null)
    if (cs && typeof cs === 'object' && !Array.isArray(cs)) {
      let changed = false
      const stamp = planStart() + 'T12:00:00.000Z'
      const next = { ...cs }
      for (const k of Object.keys(next)) {
        if (next[k] === true) { next[k] = stamp; changed = true }
      }
      if (changed) setStore('cs:done', next)
    }
    setStore('migrated:v1', true)
  } catch (e) {}
}
export function daysSince(iso) {
  const a = new Date(iso + 'T00:00:00'); const b = new Date(); b.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((b - a) / 86400000))
}

export function readingStats(planId) {
  const plan = PLANS[planId]
  if (!plan) return { pct: 0, done: 0, total: 0, currentDay: 1, day: null, expectedDay: 1, behind: 0, ahead: 0, finished: false, paceLabel: 'On track' }
  const st = getStore(readKey(planId), { done: {}, notes: {} })
  const done = plan.days.filter((d) => st.done[d.n]).length
  const open = plan.days.find((d) => !st.done[d.n])
  const currentDay = open ? open.n : plan.total
  // Scheduled tracks pace against calendar dates (skips excluded); others against elapsed days.
  let expectedDay, behind, ahead
  if (isScheduled(planId)) {
    const due = scheduleInfo(planId, plan.total).due
    expectedDay = Math.min(plan.total, due)
    behind = Math.max(0, due - done)
    ahead = Math.max(0, done - due)
  } else {
    const elapsed = daysSince(planStart())
    expectedDay = Math.min(plan.total, elapsed + 1)
    behind = Math.max(0, elapsed - done)
    ahead = Math.max(0, done - elapsed)
  }
  const finished = done >= plan.total
  return { pct: Math.round((done / plan.total) * 100), done, total: plan.total, currentDay, day: plan.days[currentDay - 1], expectedDay, behind, ahead, finished, paceLabel: finished ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track' }
}

export function useReading(planId) {
  const plan = PLANS[planId]
  const [st, setSt] = useStore(readKey(planId), { done: {}, notes: {} })
  const toggle = useCallback((n) => {
    setSt((s) => {
      const done = { ...s.done }
      if (done[n]) delete done[n]
      else done[n] = new Date().toISOString()
      return { ...s, done }
    })
  }, [setSt])
  const setNote = useCallback((n, text) => {
    setSt((s) => ({ ...s, notes: { ...s.notes, [n]: text } }))
  }, [setSt])
  const doneCount = plan.days.filter((d) => st.done[d.n]).length
  const open = plan.days.find((d) => !st.done[d.n])
  let expectedDay, behind, ahead
  if (isScheduled(planId)) {
    const due = scheduleInfo(planId, plan.total).due
    expectedDay = Math.min(plan.total, due)
    behind = Math.max(0, due - doneCount)
    ahead = Math.max(0, doneCount - due)
  } else {
    const elapsed = daysSince(planStart())
    expectedDay = Math.min(plan.total, elapsed + 1)
    behind = Math.max(0, elapsed - doneCount)
    ahead = Math.max(0, doneCount - elapsed)
  }
  const finished = doneCount >= plan.total
  return {
    plan, done: st.done, notes: st.notes, toggle, setNote,
    doneCount, total: plan.total,
    pct: Math.round((doneCount / plan.total) * 100),
    currentDay: open ? open.n : plan.total,
    expectedDay, behind, ahead, finished,
    paceLabel: finished ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track',
  }
}

export function useCollection(key, seed = []) {
  const [items, setItems] = useStore(`col:${key}`, seed)
  const add = useCallback((rec) => setItems((xs) => [{ id: uid(), created: Date.now(), ...rec }, ...xs]), [setItems])
  const update = useCallback((id, patch) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))), [setItems])
  const remove = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), [setItems])
  return { items, add, update, remove, setItems }
}

// date (ISO) -> number of completions that day, across every track.
function completionsByDate() {
  const map = {}
  const bump = (iso) => { if (iso) map[iso] = (map[iso] || 0) + 1 }
  DONE_STORES.forEach((s) => {
    Object.values(doneMap(s)).forEach((ts) => { if (typeof ts === 'string') bump(ts.slice(0, 10)) })
  })
  dsaSolvedDates().forEach(bump)
  return map
}

// UTC day-buckets ending today, oldest first. Every completion stamp in the app is an
// ISO string, so bucketing by UTC date is what keeps the labels aligned with the data
// (local-midnight buckets were a full day off for +offset timezones).
function utcDays(n) {
  const now = new Date()
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base - i * 86400000)
    out.push({ iso: d.toISOString().slice(0, 10), dow: d.getUTCDay() })
  }
  return out
}

export function activityLast7() {
  const map = completionsByDate()
  const days = utcDays(7)
  const raw = days.map((d) => map[d.iso] || 0)
  const max = Math.max(1, ...raw)
  const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return {
    values: raw.map((v) => Math.round((v / max) * 100)),
    raw,
    total: raw.reduce((a, b) => a + b, 0),
    labels: days.map((d) => DOW[d.dow]),
    dates: days.map((d) => d.iso),
  }
}

export function activityRange(days = 91) {
  const map = completionsByDate()
  return utcDays(days).map((d) => ({ date: d.iso, count: map[d.iso] || 0, dow: d.dow }))
}

// Consecutive days with at least one completion, ending today (or yesterday, so an
// as-yet-unstarted today doesn't zero out a live streak).
export function currentStreak() {
  const range = activityRange(400)
  let s = 0, i = range.length - 1
  if (range[i] && range[i].count === 0) i--
  for (; i >= 0 && range[i] && range[i].count > 0; i--) s++
  return s
}

// Home heatmap: date -> number of distinct tracks active that day, among DSA,
// CS Core, System Design, Full Stack, LLD and SQL. The calendar renders 5 heat
// levels and clamps, so a 6-track day shows at the top level.
export function activitySectionLevels() {
  const map = {}
  const add = (iso, sec) => { if (!iso) return; (map[iso] = map[iso] || new Set()).add(sec) }
  DONE_STORES.forEach((s) => {
    Object.values(doneMap(s)).forEach((ts) => { if (typeof ts === 'string') add(ts.slice(0, 10), s.section) })
  })
  dsaSolvedDates().forEach((iso) => add(iso, 'DSA'))
  const out = {}
  Object.keys(map).forEach((k) => { out[k] = map[k].size })
  return out
}

const COUNT_TRACKS = [
  { key: 'cs:done', kind: 'CS Core', to: '/cs-core', noun: 'topic' },
  { key: 'odin:done', kind: 'Full Stack', to: '/full-stack', noun: 'item' },
  { key: 'lld:done', kind: 'LLD', to: '/lld', noun: 'item' },
  { key: 'sql:done', kind: 'SQL', to: '/sql', noun: 'item' },
]

export function entriesForDate(iso) {
  const out = []
  const sd = getStore('read:system-design', { done: {} })
  Object.entries(sd.done || {}).forEach(([n, ts]) => {
    if (String(ts).slice(0, 10) === iso) out.push({ kind: 'Reading', label: `System Design · Day ${n}`, to: '/system-design' })
  })
  getStore('col:dsa', []).forEach((x) => {
    if (dsaSolvedISO(x) !== iso) return
    out.push({ kind: 'DSA', label: x.score ? `${x.title} · ${x.score}/5` : String(x.title || 'Problem'), to: '/dsa' })
  })
  COUNT_TRACKS.forEach((t) => {
    const n = Object.values(getStore(t.key, {})).filter((ts) => typeof ts === 'string' && ts.slice(0, 10) === iso).length
    if (n) out.push({ kind: t.kind, label: `${n} ${t.noun}${n > 1 ? 's' : ''} completed`, to: t.to })
  })
  return out
}
