// Redistribute the backlog in "Placement DSA · Aug–Sep 2026" (dsa_problems, Supabase).
//
// Why: as of 2026-08-23 the plan had fallen behind (36/252 solved, last solve 2026-08-21)
// with 28 unsolved items still dated in the past. This repacks every unsolved item
// starting today at a flat 5 problems/day, keeps Wednesdays off (already true structurally,
// re-verified here), and drops the final 2-day "Consolidation" block at the tail of the
// plan (deemed unnecessary while catching up).
//
// Solved rows are never touched. Quiz-light days (2026-09-01, 2026-09-03 — real exam
// mornings) keep their fixed dates. Weak-topic (DP, Graphs) video-watch reminders are
// merged into one row per topic and placed on the first day that topic's problems land.
// Periodic revision/buffer days are dropped entirely to keep the catch-up schedule tight.
//
// Run:  node web/scripts/redistribute-placement-dsa.mjs [--dry-run]

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DRY = process.argv.includes('--dry-run')

const env = readFileSync(join(__dir, '..', '.env.local'), 'utf8')
const grab = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim()
const SB_URL = grab('VITE_SUPABASE_URL')
const SB_KEY = grab('VITE_SUPABASE_ANON_KEY')
if (!SB_URL || !SB_KEY) { console.error('Missing Supabase env vars in web/.env.local'); process.exit(1) }
const H = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }

const PLAN = 'Placement DSA · Aug–Sep 2026'
const TODAY = '2026-08-23'
const REST_DAYS = new Set(['2026-08-31', '2026-09-02'])
const LIGHT_DAYS = new Set(['2026-09-01', '2026-09-03'])
const PER_DAY = 5
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

async function main() {
  const planEnc = encodeURIComponent(PLAN)
  const rows = await (await fetch(
    `${SB_URL}/rest/v1/dsa_problems?plan=eq.${planEnc}&select=*&order=target_date`,
    { headers: H },
  )).json()
  if (!Array.isArray(rows)) { console.error('Fetch failed:', rows); process.exit(1) }

  const solved = rows.filter((r) => r.status === 'solved')
  const todo = rows.filter((r) => r.status !== 'solved')
  console.log(`Loaded ${rows.length} rows (${solved.length} solved, ${todo.length} todo).`)

  const hasTag = (r, t) => (r.topics || []).includes(t)
  const consolidation = todo.filter((r) => hasTag(r, 'Consolidation'))
  const light = todo.filter((r) => hasTag(r, 'Light'))
  // Dropped per user request: periodic revision/buffer days are removed entirely (not
  // just the tail consolidation) to keep the catch-up schedule as tight as possible.
  const revisionBuf = todo.filter((r) => hasTag(r, 'Revision') && !hasTag(r, 'Light') && !hasTag(r, 'Consolidation'))
  const video = todo.filter((r) => hasTag(r, 'Video'))
  const claimed = new Set([...consolidation, ...light, ...revisionBuf, ...video].map((r) => r.id))
  const realProblems = todo.filter((r) => !claimed.has(r.id)) // already in original target_date order

  console.log(`Consolidation rows to drop: ${consolidation.length}`)
  console.log(`Light (fixed exam) days kept as-is: ${light.length}`)
  console.log(`Revision/buffer rows to drop: ${revisionBuf.length}`)
  console.log(`Video rows to merge per topic: ${video.length}`)
  console.log(`Real problems to reschedule: ${realProblems.length}`)

  // merge video rows per topic tag (topics[0]), keep first row per topic as the survivor
  const videoByTopic = new Map()
  for (const r of video) {
    const tag = (r.topics || [])[0]
    if (!videoByTopic.has(tag)) videoByTopic.set(tag, [])
    videoByTopic.get(tag).push(r)
  }
  const videoSurvivors = new Map() // tag -> row (mutated with merged notes)
  const videoToDelete = []
  for (const [tag, group] of videoByTopic) {
    const survivor = { ...group[0] }
    survivor.title = `▶ Watch — remaining Striver ${tag} lectures (${group.length} sessions)`
    survivor.notes = 'Resume the Striver playlist for this topic; watch what you have not yet covered before solving the day\'s problems.'
    videoSurvivors.set(tag, survivor)
    videoToDelete.push(...group.slice(1).map((r) => r.id))
  }

  // ---- build the new day sequence from TODAY, skipping Wednesdays + rest days ----
  const days = []
  const start = new Date(TODAY + 'T00:00:00')
  const cursor = new Date(start)
  const NEED = realProblems.length
  let placedProblems = 0
  let contentDayCount = 0
  // generate enough days (cap iterations as a safety valve)
  for (let i = 0; i < 400 && placedProblems < NEED; i++) {
    const key = iso(cursor)
    cursor.setDate(cursor.getDate() + 1)
    if (REST_DAYS.has(key)) continue
    if (new Date(key + 'T00:00:00').getDay() === 3) continue // Wednesday
    if (LIGHT_DAYS.has(key)) { days.push({ key, kind: 'light' }); continue }
    contentDayCount++
    days.push({ key, kind: 'normal' })
    placedProblems += PER_DAY
  }

  // ---- assign real problems + video rows to 'normal' days ----
  const updates = [] // { id, target_date, title?, notes? }
  let pi = 0
  let lastTopic = null
  const videoPlaced = new Set()
  for (const d of days) {
    if (d.kind !== 'normal') continue
    const chunk = realProblems.slice(pi, pi + PER_DAY)
    if (!chunk.length) continue
    pi += chunk.length
    for (const r of chunk) {
      const tag = (r.topics || [])[0]
      if (tag !== lastTopic && videoSurvivors.has(tag) && !videoPlaced.has(tag)) {
        const vr = videoSurvivors.get(tag)
        updates.push({ id: vr.id, target_date: d.key, title: vr.title, notes: vr.notes })
        videoPlaced.add(tag)
      }
      lastTopic = tag
      updates.push({ id: r.id, target_date: d.key })
    }
  }
  // any video row whose topic never got reached (shouldn't happen, but be safe) -> drop
  for (const [tag, vr] of videoSurvivors) {
    if (!videoPlaced.has(tag)) videoToDelete.push(vr.id)
  }

  // revision/buffer rows are dropped entirely per user request
  const revisionToDelete = revisionBuf.map((r) => r.id)

  const finishDate = days.filter((d) => d.kind === 'normal').slice(-1)[0]?.key
  console.log(`\nNew schedule spans ${TODAY} → ${finishDate} (${days.length} calendar slots, revision/buffer days dropped).`)

  const deleteIds = [...consolidation.map((r) => r.id), ...videoToDelete, ...revisionToDelete]
  const patchUpdates = updates

  console.log(`Rows to delete: ${deleteIds.length}`)
  console.log(`Rows to patch (date/title/notes): ${patchUpdates.length}`)

  if (DRY) { console.log('\n--dry-run, no writes performed.'); return }

  for (const id of deleteIds) {
    const r = await fetch(`${SB_URL}/rest/v1/dsa_problems?id=eq.${id}`, { method: 'DELETE', headers: H })
    if (r.status >= 300) { console.error('DELETE failed', id, r.status, await r.text()); process.exit(1) }
  }
  console.log(`Deleted ${deleteIds.length} rows.`)

  for (const u of patchUpdates) {
    const body = { target_date: u.target_date }
    if (u.title) body.title = u.title
    if (u.notes) body.notes = u.notes
    const r = await fetch(`${SB_URL}/rest/v1/dsa_problems?id=eq.${u.id}`, {
      method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(body),
    })
    if (r.status >= 300) { console.error('PATCH failed', u.id, r.status, await r.text()); process.exit(1) }
  }
  console.log(`Patched ${patchUpdates.length} rows.`)

  // ---- verify ----
  const back = await (await fetch(`${SB_URL}/rest/v1/dsa_problems?plan=eq.${planEnc}&select=title,topics,target_date,status&order=target_date`, { headers: H })).json()
  const wed = back.filter((r) => new Date(r.target_date + 'T00:00:00').getDay() === 3)
  const rest = back.filter((r) => REST_DAYS.has(r.target_date))
  const consolLeft = back.filter((r) => (r.topics || []).includes('Consolidation'))
  console.log('\n=== VERIFY ===')
  console.log('Total rows now:', back.length)
  console.log('Rows on Wednesdays (must be 0):', wed.length)
  console.log('Rows on rest days (must be 0):', rest.length)
  console.log('Consolidation rows left (must be 0):', consolLeft.length)
  const dates = back.map((r) => r.target_date).sort()
  console.log('Date span:', dates[0], '→', dates[dates.length - 1])
  const ok = wed.length === 0 && rest.length === 0 && consolLeft.length === 0
  console.log(ok ? '\n✅ ALL CHECKS PASSED' : '\n❌ CHECKS FAILED')
  process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error('FATAL', e); process.exit(1) })
