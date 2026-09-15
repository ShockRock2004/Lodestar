import { useCallback, useEffect, useState } from 'react'

const NS = 'studyos:'

export function getStore(key, fallback) {
  try {
    const v = localStorage.getItem(NS + key)
    return v ? JSON.parse(v) : fallback
  } catch (e) {
    return fallback
  }
}

export function setStore(key, val) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(val))
    window.dispatchEvent(new CustomEvent('studyos-store', { detail: { key } }))
  } catch (e) {}
}

export function useStore(key, fallback) {
  const [val, setVal] = useState(() => getStore(key, fallback))
  useEffect(() => {
    const onEvt = (e) => {
      if (!e.detail || e.detail.key === key) setVal(getStore(key, fallback))
    }
    window.addEventListener('studyos-store', onEvt)
    window.addEventListener('storage', onEvt)
    return () => {
      window.removeEventListener('studyos-store', onEvt)
      window.removeEventListener('storage', onEvt)
    }
  }, [key])
  const set = useCallback((next) => {
    const cur = getStore(key, fallback)
    const v = typeof next === 'function' ? next(cur) : next
    setStore(key, v)
    setVal(v)
  }, [key])
  return [val, set]
}

// Re-renders on ANY store write (local or from another tab). For views whose numbers
// are derived from several keys at once — the home dashboard reads six tracks — this
// is what keeps them live instead of frozen at their first-mount snapshot.
export function useStoreTick() {
  const [, bump] = useState(0)
  useEffect(() => {
    const onEvt = () => bump((n) => n + 1)
    window.addEventListener('studyos-store', onEvt)
    window.addEventListener('storage', onEvt)
    return () => {
      window.removeEventListener('studyos-store', onEvt)
      window.removeEventListener('storage', onEvt)
    }
  }, [])
}

export const uid = () => {
  try { return crypto.randomUUID() } catch (e) { return String(Date.now()) + Math.random().toString(16).slice(2) }
}
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
