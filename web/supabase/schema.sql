-- Study OS — DSA problems + contest reminders schema.
-- Run ONCE in the Supabase SQL editor (Dashboard > SQL). Until then the app runs
-- offline-first on localStorage and simply skips the cloud sync.
-- Client generates uuid primary keys so the local cache and cloud rows share ids.

create table if not exists public.dsa_problems (
  id          uuid primary key,
  slug        text,
  title       text,
  url         text,
  difficulty  text,                         -- 'Easy' | 'Medium' | 'Hard'
  topics      text[] default '{}',
  notes       text default '',
  status      text default 'todo',          -- 'todo' | 'solved'
  score       int,
  target_date date,
  source      text default 'manual',        -- 'manual' | 'csv'
  plan        text default 'My problems',  -- one CSV upload = one named plan
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  solved_at   timestamptz
);

create table if not exists public.contest_reminders (
  id                 uuid primary key,
  platform           text,                  -- 'LeetCode' | 'Codeforces' | 'CodeChef'
  name               text,
  starts_at          timestamptz,
  remind_before_mins int default 60,
  notified           boolean default false,
  created_at         timestamptz default now()
);

alter table public.dsa_problems      enable row level security;
alter table public.contest_reminders enable row level security;

-- Personal single-user app: permissive anon CRUD. NOTE: the anon/publishable key ships
-- in the client bundle, so anyone with your deployed URL could read/write these tables.
-- For a private deploy, drop these and use the Supabase-Auth owner policies below.
drop policy if exists "anon all dsa"      on public.dsa_problems;
drop policy if exists "anon all contests" on public.contest_reminders;
create policy "anon all dsa"       on public.dsa_problems      for all using (true) with check (true);
create policy "anon all contests"  on public.contest_reminders for all using (true) with check (true);

-- ---- Everything else: a single key-value store mirrored from localStorage --------------
-- Reading progress (read:*), CS Core (cs:*), Full Stack (odin:*), the quant bank
-- (col:quant), goals and settings all sync here as jsonb blobs keyed by their store key.
-- The web app writes these; the phone app can read them the same way.
create table if not exists public.app_state (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
drop policy if exists "anon all app_state" on public.app_state;
create policy "anon all app_state" on public.app_state for all using (true) with check (true);

-- ---- Secure alternative (recommended before you share the URL) ---------------------
-- 1) add:  alter table public.dsa_problems      add column owner uuid default auth.uid();
--          alter table public.contest_reminders add column owner uuid default auth.uid();
-- 2) enable Supabase Auth (email magic link) and sign in as your single user.
-- 3) replace the anon policies with:
--    create policy "owner dsa"      on public.dsa_problems
--      for all using (auth.uid() = owner) with check (auth.uid() = owner);
--    create policy "owner contests" on public.contest_reminders
--      for all using (auth.uid() = owner) with check (auth.uid() = owner);
