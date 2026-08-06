import { useCallback, useEffect, useState } from 'react'
import { getStore, setStore, useStore, uid } from './store'
import { supabase } from './supabase'

// Offline-first collection backed by a Supabase table and mirrored to localStorage, so the
// UI renders instantly and keeps working with no backend. Writes update the local cache
// immediately (optimistic) and best-effort sync to Supabase. Client-generated uuid ids keep
// local and cloud rows in lockstep (no reconciliation). Single user => last-write-wins.
//   toRow  : item -> DB-column subset (drop client-only fields before upsert)
//   fromRow: DB row -> item
const mergeById = (local, cloud) => {
  const by = new Map(local.map((x) => [x.id, x]))
  cloud.forEach((c) => by.set(c.id, c)) // cloud wins on conflict; keep unsynced local-only rows
  return Array.from(by.values())
}

export function useCloud(table, { localKey, seed = [], toRow = (x) => x, fromRow = (x) => x } = {}) {
  const [items, setItems] = useStore(localKey, seed)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let alive = true
    setSyncing(true)
    supabase.from(table).select('*').then(({ data, error }) => {
      if (!alive) return
      setSyncing(false)
      if (error || !data) return
      setStore(localKey, mergeById(getStore(localKey, []), data.map(fromRow)))
    })
    return () => { alive = false }
  }, [table, localKey]) // eslint-disable-line

  const pushRow = useCallback((row) => {
    if (!supabase) return
    supabase.from(table).upsert(toRow(row)).then(({ error }) => {
      if (error) console.warn(`[cloud] upsert ${table} failed:`, error.message)
    })
  }, [table]) // eslint-disable-line

  const add = useCallback((rec) => {
    const row = { id: uid(), created_at: new Date().toISOString(), ...rec }
    setItems((xs) => [row, ...xs])
    pushRow(row)
    return row
  }, [setItems, pushRow])

  const update = useCallback((id, patch) => {
    let next = null
    setItems((xs) => xs.map((x) => (x.id === id ? (next = { ...x, ...patch }) : x)))
    if (next) pushRow(next)
  }, [setItems, pushRow])

  const upsertMany = useCallback((rows) => {
    if (!rows || !rows.length) return
    setItems((xs) => mergeById(xs, rows))
    if (supabase) supabase.from(table).upsert(rows.map(toRow)).then(({ error }) => {
      if (error) console.warn(`[cloud] bulk upsert ${table} failed:`, error.message)
    })
  }, [setItems, table]) // eslint-disable-line

  const remove = useCallback((id) => {
    setItems((xs) => xs.filter((x) => x.id !== id))
    if (supabase) supabase.from(table).delete().eq('id', id).then(({ error }) => {
      if (error) console.warn(`[cloud] delete ${table} failed:`, error.message)
    })
  }, [setItems, table]) // eslint-disable-line

  return { items, add, update, remove, upsertMany, setItems, syncing }
}
