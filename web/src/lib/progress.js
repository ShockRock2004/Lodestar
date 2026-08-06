import { useCallback } from 'react'
import { getStore, setStore, useStore, uid, todayISO } from './store.js'
import { PLANS } from './plans.js'
import { isScheduled, scheduleInfo } from './schedule.js'

const readKey = (planId) => `read:${planId}`

function earliestActivityISO() {
  let min = null
  const consider = (d) => { if (d && (!min || d < min)) min = d }
  ;['system-design', 'math', 'handson'].forEach((pid) => {
    const st = getStore(`read:${pid}`, { done: {} })
    Object.values(st.done || {}).forEach((ts) => { if (typeof ts === 'string') consider(ts.slice(0, 10)) })
  })
  Object.values(getStore('cs:done', {})).forEach((ts) => { if (typeof ts === 'string') consider(ts.slice(0, 10)) })
  Object.values(getStore('odin:done', {})).forEach((ts) => { if (typeof ts === 'string') consider(ts.slice(0, 10)) })
  getStore('col:dsa', []).forEach((x) => consider(x.date || (x.created ? new Date(x.created).toISOString().slice(0, 10) : null)))
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
  if (!plan) return { pct: 0, done: 0, total: 0, currentDay: 1, day: null }
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

export function activityLast7() {
  const now = new Date()
  // Bucket by UTC calendar date to match the ISO stamps stored everywhere (todayISO,
  // cs/read/odin/dsa). Local-midnight labels were a full day off for +offset timezones.
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const counts = {}; const order = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base - i * 86400000)
    const k = d.toISOString().slice(0, 10); counts[k] = 0; order.push({ k, dow: d.getUTCDay() })
  }
  ;['system-design', 'math', 'handson'].forEach((pid) => {
    const st = getStore(`read:${pid}`, { done: {} })
    Object.values(st.done || {}).forEach((ts) => { const k = String(ts).slice(0, 10); if (k in counts) counts[k]++ })
  })
  ;['dsa', 'quant'].forEach((c) => {
    getStore(`col:${c}`, []).forEach((x) => {
      const k = new Date(x.created || Date.now()).toISOString().slice(0, 10); if (k in counts) counts[k]++
    })
  })
  Object.values(getStore('cs:done', {})).forEach((ts) => { if (typeof ts === 'string') { const k = ts.slice(0, 10); if (k in counts) counts[k]++ } })
  Object.values(getStore('odin:done', {})).forEach((ts) => { if (typeof ts === 'string') { const k = ts.slice(0, 10); if (k in counts) counts[k]++ } })
  Object.values(getStore('lld:done', {})).forEach((ts) => { if (typeof ts === 'string') { const k = ts.slice(0, 10); if (k in counts) counts[k]++ } })
  const raw = order.map((o) => counts[o.k])
  const max = Math.max(1, ...raw)
  const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return { values: raw.map((v) => Math.round((v / max) * 100)), raw, total: raw.reduce((a, b) => a + b, 0), labels: order.map((o) => DOW[o.dow]) }
}

export function activityRange(days = 91) {
  const now = new Date()
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const map = {}
  ;['system-design', 'math', 'handson'].forEach((pid) => {
    const st = getStore(`read:${pid}`, { done: {} })
    Object.values(st.done || {}).forEach((ts) => { const k = String(ts).slice(0, 10); map[k] = (map[k] || 0) + 1 })
  })
  ;['dsa', 'quant'].forEach((c) => {
    getStore(`col:${c}`, []).forEach((x) => { const k = new Date(x.created || Date.now()).toISOString().slice(0, 10); map[k] = (map[k] || 0) + 1 })
  })
  Object.values(getStore('cs:done', {})).forEach((ts) => { if (typeof ts === 'string') { const k = ts.slice(0, 10); map[k] = (map[k] || 0) + 1 } })
  Object.values(getStore('odin:done', {})).forEach((ts) => { if (typeof ts === 'string') { const k = ts.slice(0, 10); map[k] = (map[k] || 0) + 1 } })
  Object.values(getStore('lld:done', {})).forEach((ts) => { if (typeof ts === 'string') { const k = ts.slice(0, 10); map[k] = (map[k] || 0) + 1 } })
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base - i * 86400000)
    const k = d.toISOString().slice(0, 10)
    out.push({ date: k, count: map[k] || 0, dow: d.getUTCDay() })
  }
  return out
}

export function cumulativeSeries(days = 30) {
  const range = activityRange(days); let acc = 0
  return range.map((r) => { acc += r.count; return { date: r.date.slice(5), done: acc, day: r.count } })
}

export function sectionsSummary() {
  const sd = readingStats('system-design'), m = readingStats('math'), h = readingStats('handson')
  const cs = getStore('cs:stats', { done: 0, total: 0, pct: 0 })
  return [
    { key: 'System Design', done: sd.done, total: sd.total, pct: sd.pct, color: '#a77bff' },
    { key: 'Math for ML', done: m.done, total: m.total, pct: m.pct, color: '#6f9bff' },
    { key: 'Hands-On ML', done: h.done, total: h.total, pct: h.pct, color: '#4fd3df' },
    { key: 'CS Core', done: cs.done, total: cs.total || 46, pct: cs.pct, color: '#5fe3b6' },
  ]
}

// Home heatmap: date -> number of distinct tracks active that day (1..5), among
// DSA, CS Core, ML·Quant, System Design, Full Stack. Used as the 5 heat levels.
export function activitySectionLevels() {
  const map = {}
  const add = (iso, sec) => { if (!iso) return; (map[iso] = map[iso] || new Set()).add(sec) }
  Object.values(getStore('read:system-design', { done: {} }).done || {}).forEach((ts) => { if (typeof ts === 'string') add(ts.slice(0, 10), 'SD') })
  ;['math', 'handson'].forEach((pid) => {
    Object.values(getStore(`read:${pid}`, { done: {} }).done || {}).forEach((ts) => { if (typeof ts === 'string') add(ts.slice(0, 10), 'ML') })
  })
  getStore('col:quant', []).forEach((x) => add(new Date(x.created || Date.now()).toISOString().slice(0, 10), 'ML'))
  getStore('col:dsa', []).forEach((x) => add(x.date || (x.created ? new Date(x.created).toISOString().slice(0, 10) : null), 'DSA'))
  Object.values(getStore('cs:done', {})).forEach((ts) => { if (typeof ts === 'string') add(ts.slice(0, 10), 'CS') })
  Object.values(getStore('odin:done', {})).forEach((ts) => { if (typeof ts === 'string') add(ts.slice(0, 10), 'FS') })
  Object.values(getStore('lld:done', {})).forEach((ts) => { if (typeof ts === 'string') add(ts.slice(0, 10), 'LLD') })
  const out = {}
  Object.keys(map).forEach((k) => { out[k] = map[k].size })
  return out
}

export function entriesForDate(iso) {
  const out = []
  const NAMES = { 'system-design': 'System Design', math: 'Math for ML', handson: 'Hands-On ML' }
  const TO = { 'system-design': '/system-design', math: '/ml-quant', handson: '/ml-quant' }
  ;['system-design', 'math', 'handson'].forEach((pid) => {
    const st = getStore(`read:${pid}`, { done: {} })
    Object.entries(st.done || {}).forEach(([n, ts]) => {
      if (String(ts).slice(0, 10) === iso) out.push({ kind: 'Reading', label: `${NAMES[pid]} · Day ${n}`, to: TO[pid] })
    })
  })
  getStore('col:dsa', []).forEach((x) => { if (x.date === iso) out.push({ kind: 'DSA', label: `${x.title} · ${x.score}/5`, to: '/dsa' }) })
  const cs = Object.values(getStore('cs:done', {})).filter((ts) => typeof ts === 'string' && ts.slice(0, 10) === iso).length
  if (cs) out.push({ kind: 'CS Core', label: `${cs} topic${cs > 1 ? 's' : ''} completed`, to: '/cs-core' })
  const odin = Object.values(getStore('odin:done', {})).filter((ts) => typeof ts === 'string' && ts.slice(0, 10) === iso).length
  if (odin) out.push({ kind: 'Full Stack', label: `${odin} item${odin > 1 ? 's' : ''} completed`, to: '/full-stack' })
  const lld = Object.values(getStore('lld:done', {})).filter((ts) => typeof ts === 'string' && ts.slice(0, 10) === iso).length
  if (lld) out.push({ kind: 'LLD', label: `${lld} item${lld > 1 ? 's' : ''} completed`, to: '/lld' })
  return out
}
