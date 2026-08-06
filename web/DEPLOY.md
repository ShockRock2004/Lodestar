# Deploying Study OS (free, single-user, no Git required)

The app is a **static Vite SPA** + **one tiny stateless function** (`/api/leetcode`,
which fetches LeetCode question metadata server-side to dodge browser CORS). Your data
lives in **Supabase** (free tier). Nothing here requires GitHub.

Everything already works **locally** with `npm run dev` — deployment is only so you can
reach it from other devices / your future phone app.

## 1. Supabase (data + reminder sync) — one time
1. Open your Supabase project → **SQL Editor** → paste & run `supabase/schema.sql`.
   That creates `dsa_problems` and `contest_reminders`.
2. Your keys are already in `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   Because you build locally, they get baked into the bundle — the host needs no secrets.
3. Until you run the SQL, the app runs **offline-first on localStorage** (you'll just see a
   harmless `upsert ... failed` console warning on save). After it, saves sync to the cloud.
> Security: the schema ships **permissive anon RLS** (fine for a private URL). Before sharing
> the URL, switch to the **Supabase-Auth owner policies** commented at the bottom of the SQL.

## 2. Build
```
npm run build       # outputs dist/  (also copies functions-free assets + _redirects + dsa-template.csv)
```

## 3. Deploy free — pick one (CLI, no GitHub)

### Cloudflare Pages  (recommended — my function is already in its format)
```
npm i -g wrangler
wrangler login                          # one-time, opens browser
wrangler pages deploy dist              # run from the project root so ./functions is bundled
```
- `functions/api/leetcode.js` auto-serves at `/api/leetcode`.
- SPA routing handled by `public/_redirects` (`/* /index.html 200`).

### Netlify
```
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```
- Move the function to `netlify/functions/leetcode.js` and change the wrapper to
  `exports.handler = async (event) => ({ statusCode, body })` (same LeetCode fetch inside).
- Add a redirect `/api/leetcode  /.netlify/functions/leetcode  200` to `_redirects`.

### Vercel
```
npm i -g vercel
vercel --prod
```
- Move the function to `api/leetcode.js` as `export default function handler(req, res) {}`
  (same fetch); it serves at `/api/leetcode` automatically.
- Add `vercel.json` with a rewrite of everything else to `/index.html` for SPA routing.

## 4. Future phone app
It reads `dsa_problems` and `contest_reminders` straight from Supabase and schedules a native
local notification at `starts_at` minus `remind_before_mins`. The web app is the authoring UI;
Supabase is the shared source of truth. The web also offers **Add to Google Calendar / .ics**
(with a matching alarm) so reminders work today, before the phone app exists.
