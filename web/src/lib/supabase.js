import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn('[Lodestar] Supabase env vars missing — running without a backend.')
}

export const supabase = url && key ? createClient(url, key) : null
