# Lodestar

A personal study-tracking system backed by Supabase.

- **`web/`** — the Lodestar web dashboard (React + Vite). Tracks reading plans, DSA practice, CS Core, System Design, and the Odin full-stack path.

## Getting started

```bash
cd web
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev                  # http://localhost:5173
npm run build                # production build -> dist/
```

## Environment

The app needs a Supabase project URL and its **publishable (anon)** key — client-safe, protected by Row Level Security. Never commit `.env` / `.env.local`; a template is in `web/.env.example`.

## Notes

- The web app deploys to Vercel (see `web/vercel.json`); set the two `VITE_SUPABASE_*` env vars in the Vercel project.
