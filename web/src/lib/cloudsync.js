import { supabase } from './supabase.js'
import { getStore } from './store.js'

// Global localStorage <-> Supabase mirror. Every persistent studyos key (reading
// progress, CS Core, Full Stack, the quant bank, goals & settings) is stored as a
// jsonb blob in the `app_state` KV table. col:dsa / col:contests are excluded because
// they already sync through their own dedicated tables via useCloud().
const NS = 'studyos:'
const EXCLUDE = new Set(['col:dsa', 'col:contests'])
const syncable = (key) => !!key && !EXCLUDE.has(key)

const timers = {}
let started = false

function push(key) {
  if (!supabase || !syncable(key)) return
  const value = getStore(key, null)
  if (value === null || value === undefined) return
  supabase.from('app_state').upsert({ key, value, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) console.warn('[cloudsync] upsert', key, error.message) })
}

function onLocalWrite(e) {
  const key = e && e.detail && e.detail.key
  if (!syncable(key)) return
  clearTimeout(timers[key])
  timers[key] = setTimeout(() => push(key), 700) // debounce bursts (typing notes, etc.)
}

// Pull cloud state into localStorage (cloud wins on load), seed the cloud with any
// local-only keys, then keep pushing local writes. No-op without a configured client
// or before the schema exists (the load simply errors and we stay offline-first).
export async function startCloudSync() {
  if (started || !supabase) return
  started = true
  try {
    const { data, error } = await supabase.from('app_state').select('key,value')
    if (error) { console.warn('[cloudsync] load skipped:', error.message); return }
    const cloudKeys = new Set()
    ;(data || []).forEach((row) => {
      cloudKeys.add(row.key)
      try { localStorage.setItem(NS + row.key, JSON.stringify(row.value)) } catch (e) { /* quota */ }
      window.dispatchEvent(new CustomEvent('studyos-store', { detail: { key: row.key } }))
    })
    for (let i = 0; i < localStorage.length; i++) {
      const full = localStorage.key(i)
      if (!full || full.indexOf(NS) !== 0) continue
      const key = full.slice(NS.length)
      if (syncable(key) && !cloudKeys.has(key)) push(key) // first device seeds the cloud
    }
    window.addEventListener('studyos-store', onLocalWrite)
  } catch (e) {
    console.warn('[cloudsync] init error', e)
  }
}
