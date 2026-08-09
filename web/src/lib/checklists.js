import { useCallback } from 'react'
import { getStore, useStore, uid, todayISO } from './store.js'
import { parseObjective, timeState, nowMins } from './timephrase.js'
import { urgencyOf } from './urgency.js'

// Checklists live under one studyos key, so cloudsync.js mirrors them to Supabase
// `app_state` for free (the key is not in its EXCLUDE set).
export const CHECKLIST_KEY = 'checklists'

/*  shape
    { id, title, urgency, created, items: [
        { id, text, done, doneAt, start, end }   // start/end = minutes since midnight, or null
    ] }                                                                              */

export const newItem = (line) => {
  const p = parseObjective(line)
  if (!p) return null
  return { id: uid(), text: p.text, done: false, doneAt: null, start: p.start, end: p.end }
}

export const newChecklist = (title, urgency = 'normal', lines = []) => ({
  id: uid(),
  title: String(title || '').trim() || 'Untitled checklist',
  urgency,
  created: new Date().toISOString(),
  items: lines.map(newItem).filter(Boolean),
})

export const progressOf = (list) => {
  const total = list.items.length
  const done = list.items.filter((i) => i.done).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, complete: total > 0 && done === total }
}

export const getChecklists = () => getStore(CHECKLIST_KEY, [])

export function useChecklists() {
  const [lists, setLists] = useStore(CHECKLIST_KEY, [])

  const addList = useCallback((rec) => {
    const list = { ...newChecklist(rec.title, rec.urgency), ...rec, id: rec.id || uid() }
    setLists((xs) => [list, ...xs])
    return list
  }, [setLists])

  const updateList = useCallback((id, patch) => {
    setLists((xs) => xs.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [setLists])

  const removeList = useCallback((id) => setLists((xs) => xs.filter((l) => l.id !== id)), [setLists])

  const addItem = useCallback((listId, line) => {
    const it = newItem(line)
    if (!it) return
    setLists((xs) => xs.map((l) => (l.id === listId ? { ...l, items: [...l.items, it] } : l)))
  }, [setLists])

  const updateItem = useCallback((listId, itemId, patch) => {
    setLists((xs) => xs.map((l) => (l.id !== listId ? l
      : { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) })))
  }, [setLists])

  const toggleItem = useCallback((listId, itemId) => {
    setLists((xs) => xs.map((l) => (l.id !== listId ? l
      : {
        ...l,
        items: l.items.map((i) => (i.id !== itemId ? i
          : { ...i, done: !i.done, doneAt: i.done ? null : new Date().toISOString() })),
      })))
  }, [setLists])

  const removeItem = useCallback((listId, itemId) => {
    setLists((xs) => xs.map((l) => (l.id !== listId ? l : { ...l, items: l.items.filter((i) => i.id !== itemId) })))
  }, [setLists])

  return { lists, setLists, addList, updateList, removeList, addItem, updateItem, toggleItem, removeItem }
}

// Flatten every open objective into one ranked feed for the "Urgent & upcoming" rail.
// Ordering: running right now -> starting soon -> critical/high untimed -> everything
// else by urgency then start time. Overdue timed items are surfaced, not hidden.
export function urgentFeed(lists, now = nowMins()) {
  const out = []
  ;(lists || []).forEach((l) => {
    const u = urgencyOf(l.urgency)
    l.items.forEach((i) => {
      if (i.done) return
      const state = timeState(i, now)
      out.push({
        listId: l.id, listTitle: l.title, urgency: u, item: i, state,
        overdue: state === 'past',
      })
    })
  })
  const bucket = (r) => {
    if (r.state === 'now') return 0
    if (r.state === 'soon') return 1
    if (r.overdue) return 2
    if (r.item.start != null) return 3
    return r.urgency.rank >= 2 ? 3 : 4
  }
  return out.sort((a, b) => {
    const d = bucket(a) - bucket(b)
    if (d) return d
    const u = b.urgency.rank - a.urgency.rank
    if (u) return u
    const at = a.item.start == null ? 1e9 : a.item.start
    const bt = b.item.start == null ? 1e9 : b.item.start
    return at - bt
  })
}

// Compact roll-up for the home card and the AI context.
export function checklistSummary(lists) {
  const all = lists || []
  const active = all.filter((l) => !progressOf(l).complete)
  let openItems = 0, criticalOpen = 0, doneToday = 0, totalItems = 0, doneItems = 0
  const today = todayISO()
  all.forEach((l) => {
    const u = urgencyOf(l.urgency)
    l.items.forEach((i) => {
      totalItems++
      if (i.done) {
        doneItems++
        if (String(i.doneAt || '').slice(0, 10) === today) doneToday++
      } else {
        openItems++
        if (u.rank === 3) criticalOpen++
      }
    })
  })
  return {
    lists: all.length, active: active.length, openItems, criticalOpen, doneToday,
    totalItems, doneItems, pct: totalItems ? Math.round((doneItems / totalItems) * 100) : 0,
  }
}
