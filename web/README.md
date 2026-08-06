# Study OS

A personal study dashboard — one home for four study tracks, in a light/dark
glassmorphism + neumorphism design (blue → cyan → green gradient signature).

## Sections
1. **DSA** — daily LeetCode problem, notes, score log, Codeforces/CodeChef contest reminders
2. **CS Core** — OS · Computer Networks · DBMS adaptive video curriculum
3. **System Design** — Alex Xu Vol 1 (27d) + Vol 2 (43d) reading tracker, 10 pages/day
4. **ML · Quant** — Mathematics for ML (Ch 4–12) + Hands-On ML (8 ch) reading, plus a daily quant question bank

Cross-cutting: a fast global search, a neumorphic overall-progress gauge, and a 7-day activity chart.

## Stack
- React 18 + Vite + React Router
- Supabase (Postgres) backend — client uses the publishable/anon key with Row Level Security
- Self-hosted fonts: Plus Jakarta Sans (display) + Inter (body)
- Theme system is a 1:1 port of the approved design (light/dark, web/mobile)

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
```

## Environment
Copy `.env.example` → `.env.local` and set:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```
`.env.local` is gitignored. This project is **local-only** (no GitHub remote).

## Status
Home screen is fully built to the approved design (web + mobile, light + dark).
Section pages are themed shells; their features are the next build step.
