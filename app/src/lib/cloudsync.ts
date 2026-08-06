import { supabase } from './supabase';
import { allStoreKeys, getStore, setStore, subscribe } from './store';

// Mirrors the web app's cloudsync: every persistent studyos key (reading progress,
// CS Core, Full Stack, quant bank, goals & settings) syncs to the `app_state` KV table.
// col:dsa / col:contests are excluded (they use their own tables via useCloud).
const EXCLUDE = new Set(['col:dsa', 'col:contests']);
const syncable = (key?: string) => !!key && !EXCLUDE.has(key);

const timers: Record<string, any> = {};
let started = false;

function push(key: string) {
  if (!supabase || !syncable(key)) return;
  const value = getStore<any>(key, null);
  if (value === null || value === undefined) return;
  supabase
    .from('app_state')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error) console.warn('[cloudsync] upsert', key, error.message);
    });
}

export async function startCloudSync() {
  if (started || !supabase) return;
  started = true;
  try {
    const { data, error } = await supabase.from('app_state').select('key,value');
    if (error) {
      console.warn('[cloudsync] load skipped:', error.message);
      return;
    }
    const cloudKeys = new Set<string>();
    (data || []).forEach((row: any) => {
      cloudKeys.add(row.key);
      setStore(row.key, row.value); // hydrate — cloud wins on load
    });
    // seed the cloud with any local-only keys
    allStoreKeys().forEach((key) => {
      if (syncable(key) && !cloudKeys.has(key)) push(key);
    });
    // keep pushing subsequent local writes (debounced)
    subscribe((key) => {
      if (!syncable(key)) return;
      clearTimeout(timers[key]);
      timers[key] = setTimeout(() => push(key), 700);
    });
  } catch (e: any) {
    console.warn('[cloudsync] init error', e?.message || e);
  }
}
