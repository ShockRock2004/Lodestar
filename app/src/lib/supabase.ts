import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[Lodestar] Supabase env vars missing — running local-only.');
}

// MMKV-backed storage adapter so Supabase auth can persist a session.
const authStore = new MMKV({ id: 'lodestar-supabase' });
const mmkvAuth = {
  getItem: (k: string) => authStore.getString(k) ?? null,
  setItem: (k: string, v: string) => {
    authStore.set(k, v);
  },
  removeItem: (k: string) => {
    authStore.delete(k);
  },
};

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: mmkvAuth as any,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
