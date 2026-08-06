# Lodestar

A personal study-tracking system, in two apps that share one Supabase backend:

- **`web/`** — the Lodestar web dashboard (React + Vite). Tracks reading plans, DSA practice, CS Core, ML · Quant, System Design, and the Odin full-stack path.
- **`app/`** — the native Android app (Expo / React Native), a full rebuild that mirrors the web mobile view screen-for-screen, with haptics and a startup animation.

Both read and write the same hosted Supabase database, so progress stays in sync across web and mobile.

## Structure

```
Lodestar/
├─ web/    React + Vite  (deploys to Vercel)
└─ app/    Expo / React Native  (builds an Android APK)
```

## Getting started

### Web (`web/`)
```bash
cd web
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev                  # http://localhost:5173
npm run build                # production build -> dist/
```

### App (`app/`)
```bash
cd app
npm install
cp .env.example .env         # EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo prebuild -p android # regenerates android/ (gitignored)
npx expo run:android         # or build a release APK from android/
```

## Environment

Both apps need a Supabase project URL and its **publishable (anon)** key — client-safe, protected by Row Level Security. Never commit `.env` / `.env.local`; templates are in each app's `.env.example`.

## Notes

- The generated `android/` and `ios/` folders are not committed — run `expo prebuild` to recreate them from `app.json`.
- The web app deploys to Vercel (see `web/vercel.json`); set the two `VITE_SUPABASE_*` env vars in the Vercel project.
