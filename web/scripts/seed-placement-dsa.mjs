// Seed the "Placement DSA · Aug–Sep 2026" plan into Supabase (dsa_problems).
//
// Idempotent: deletes every row of this named plan, then re-inserts a freshly
// generated schedule. Re-running produces the exact same result. Only touches
// rows whose `plan` matches — your other problems/plans are untouched.
//
// Source of truth: ./placement-dsa-source.json (the verified Striver A2Z problem
// lists for the six placement topics). This script builds the day-by-day schedule
// from that data honoring the calendar constraints, then writes it to the cloud.
//
// Run:  node web/scripts/seed-placement-dsa.mjs
// Reads Supabase creds from web/.env.local (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const SRC = JSON.parse(readFileSync(join(__dir, 'placement-dsa-source.json'), 'utf8'))
const PLAN = SRC.plan

// ---- Supabase creds from web/.env.local ----
const env = readFileSync(join(__dir, '..', '.env.local'), 'utf8')
const grab = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim()
const SB_URL = grab('VITE_SUPABASE_URL')
const SB_KEY = grab('VITE_SUPABASE_ANON_KEY')
if (!SB_URL || !SB_KEY) { console.error('Missing Supabase env vars in web/.env.local'); process.exit(1) }
const H = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }

// =====================================================================
// 1) CALENDAR — classify Aug 1 – Sep 30 2026 into load classes
// =====================================================================
const REST_DAYS = new Set(['2026-08-31', '2026-09-02'])                 // zero items (day before exam)
const QUIZ_DAYS = new Set(['2026-09-01', '2026-09-03'])                 // light load (exam 08:00)
const HOLIDAYS = new Set(['2026-08-26', '2026-09-14'])                  // no college -> heavier fine
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function classifyDays() {
  const days = []
  for (let d = new Date(2026, 7, 3); d <= new Date(2026, 8, 30); d.setDate(d.getDate() + 1)) {
    const key = iso(d), dow = d.getDay()
    let cls
    if (REST_DAYS.has(key)) cls = 'zero'
    else if (HOLIDAYS.has(key)) cls = 'holiday'   // holiday overrides Wednesday (no classes that day)
    else if (dow === 3) cls = 'wed'               // Wednesday -> no items (5 college classes)
    else if (QUIZ_DAYS.has(key)) cls = 'quiz'
    else if (dow === 0 || dow === 6) cls = 'weekend'
    else cls = 'normal'
    days.push({ key, dow: DOW[dow], cls })
  }
  return days
}

// =====================================================================
// 2) ALLOCATOR — distribute items across days honoring per-day capacity
// =====================================================================
const CAP = { normal: 180, weekend: 210, holiday: 240, quiz: 60 } // minutes/day
const WEEK_CAP = 1260 // 21h ceiling — the Aug 24–30 week has 7 working days (holiday Wed + added Aug 27/28), so it runs hot; every other week stays ≤20h
const PMIN = { Easy: 20, Medium: 27, Hard: 45 }
const THEORY_MIN = 15
const VIDEO_MIN = 45
const REV_EVERY = 12 // insert a revision/buffer day after ~this many content days
const REV_MIN = 120, QUIZ_LIGHT_MIN = 60, CONSOL_MIN = 180 // weekly-load weight of non-content days
const pmin = (p) => (p.difficulty ? PMIN[p.difficulty] : THEORY_MIN)
const weekOf = (key) => { const dt = new Date(key + 'T00:00:00'); const day = (dt.getDay() + 6) % 7; const mon = new Date(dt); mon.setDate(dt.getDate() - day); return iso(mon) }

const BLOCKS = Object.entries(SRC.topics).map(([key, t]) => ({ key, ...t }))
const TOPIC_TAG = {
  Recursion: 'Recursion', 'Dynamic Programming': 'DP', Graphs: 'Graphs',
  'Binary Trees': 'Trees', BST: 'BST', Greedy: 'Greedy', 'Sliding Window & Two Pointer': 'Sliding Window',
}

function buildSchedule() {
  const allDays = classifyDays()
  const work = allDays.filter((d) => CAP[d.cls] > 0).map((d) => ({ ...d, cap: CAP[d.cls], used: 0, items: [], kind: 'content' }))
  const consolidation = work.slice(-2)
  consolidation.forEach((d) => { d.kind = 'consolidation' })
  work.forEach((d) => { if (d.cls === 'quiz' && d.kind === 'content') d.kind = 'quiz-light' })
  const content = work.filter((d) => d.kind === 'content')

  // weekly load ledger — pre-charge the fixed light/consolidation days
  const weekMin = {}
  const addWeek = (key, m) => { const w = weekOf(key); weekMin[w] = (weekMin[w] || 0) + m }
  work.forEach((d) => { if (d.kind === 'quiz-light') addWeek(d.key, QUIZ_LIGHT_MIN); if (d.kind === 'consolidation') addWeek(d.key, CONSOL_MIN) })

  let di = 0, sinceRev = 0
  const overflow = []
  const dueRevision = () => {
    if (sinceRev >= REV_EVERY && di < content.length) { content[di].kind = 'revision'; addWeek(content[di].key, REV_MIN); sinceRev = 0; di++; return true }
    return false
  }
  for (const block of BLOCKS) {
    let idx = 0
    for (const it of block.problems) {
      let placed = false
      while (di < content.length) {
        if (content[di].kind === 'revision') { di++; continue }
        const d = content[di]
        const fresh = d.items.length === 0
        const videoCost = block.weak && fresh ? VIDEO_MIN : 0
        const need = pmin(it) + videoCost
        const wk = weekOf(d.key)
        const dayHasRoom = d.cap - d.used >= need
        const weekHasRoom = (weekMin[wk] || 0) + need <= WEEK_CAP
        if (dayHasRoom && weekHasRoom) {
          if (videoCost) d.used += VIDEO_MIN
          d.items.push({ ...it, _block: block.key, _topic: block.label, _num: block.numbered ? block.numbered + (idx + 1) : null })
          d.used += pmin(it); addWeek(d.key, need); placed = true; break
        } else { di++; sinceRev++; dueRevision() }
      }
      if (!placed) overflow.push({ topic: block.label, title: it.title })
      idx++
    }
  }
  return { work, overflow, allDays }
}

// =====================================================================
// 3) EMIT ROWS — problems + leading video item + revision/quiz/consolidation
// =====================================================================
const STAMP = '2026-08-01T00:00:00.000Z'
const A2Z = 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/'
const slugOf = (u) => { const m = (u || '').match(/leetcode\.com\/problems\/([a-z0-9-]+)/i); return m ? m[1].toLowerCase() : null }
let seq = 0
const UID = () => { seq++; return '0a2a0000-0000-4000-8000-' + String(seq).padStart(12, '0') }
const mkRow = (o) => ({
  id: UID(), slug: o.slug ?? slugOf(o.url), title: o.title, url: o.url || null,
  difficulty: o.difficulty ?? null, topics: o.topics, notes: o.notes || '', status: 'todo',
  score: null, target_date: o.date, source: 'seed', plan: PLAN,
  created_at: STAMP, updated_at: STAMP, solved_at: null,
})

function emitRows() {
  const { work, overflow, allDays } = buildSchedule()
  const rows = []
  for (const d of work) {
    if (d.kind === 'revision') {
      rows.push(mkRow({ title: 'Revision & buffer — re-solve flagged/failed problems', url: A2Z, topics: ['Revision'], date: d.key, notes: 'Buffer day: re-attempt every problem you flagged this cycle from scratch. ~2h.' })); continue
    }
    if (d.kind === 'quiz-light') {
      rows.push(mkRow({ title: 'Light day (quiz) — quick revision + 1 warm-up', url: A2Z, topics: ['Revision', 'Light'], date: d.key, notes: 'Quiz at 08:00. Keep it light: skim yesterday’s solutions, re-attempt one flagged problem. ~1h.' })); continue
    }
    if (d.kind === 'consolidation') {
      rows.push(mkRow({ title: 'Consolidation — timed mixed set + full revision of weak areas', url: A2Z, topics: ['Consolidation'], date: d.key, notes: 'No new topics. Timed mixed set + revise Recursion/DP/Graphs weak spots. ~3h.' })); continue
    }
    if (!d.items.length) continue
    const est = (d.used / 60).toFixed(1)
    const block = BLOCKS.find((b) => b.key === d.items[0]._block)
    if (block && block.weak) {
      const nums = d.items.filter((x) => x._num).map((x) => x._num)
      const vtitle = nums.length
        ? `▶ Watch — Striver ${nums[0]}${nums.length > 1 ? '–' + nums[nums.length - 1].replace(/^[A-Za-z-]+/, '') : ''}`
        : `▶ Watch — Striver ${block.label}: ${[...new Set(d.items.map((x) => x.substep).filter(Boolean))].join(', ')}`
      rows.push(mkRow({ title: vtitle, url: block.playlist, topics: [TOPIC_TAG[block.label], 'Video', `≈${est}h`], date: d.key, notes: 'Watch the matching Striver lectures first, then solve today’s problems.' }))
    }
    d.items.forEach((it, i) => {
      const topics = [TOPIC_TAG[it._topic]]
      if (it.difficulty == null) topics.push('Theory')
      if (block && !block.weak && i === 0) topics.push(`≈${est}h`)
      rows.push(mkRow({ slug: slugOf(it.url), title: it.title, url: it.url, difficulty: it.difficulty, topics, date: d.key }))
    })
  }
  return { rows, overflow, allDays }
}

// =====================================================================
// 4) SEED SUPABASE (delete-by-plan then insert) + verify
// =====================================================================
async function main() {
  const { rows, overflow, allDays } = emitRows()
  if (overflow.length) {
    console.error('ABORT — schedule overflow (does not fit):', overflow.length, overflow.slice(0, 5))
    if (process.env.DEBUG) {
      const wk = {}
      rows.forEach((r) => { const est = r.topics.includes('Video') ? 60 : r.topics.includes('Consolidation') ? 180 : r.topics.includes('Revision') ? (r.topics.includes('Light') ? 60 : 120) : (r.difficulty ? { Easy: 20, Medium: 27, Hard: 45 }[r.difficulty] : 15); const d = new Date(r.target_date + 'T00:00:00'); const day = (d.getDay() + 6) % 7; const m = new Date(d); m.setDate(d.getDate() - day); const k = m.toISOString().slice(0, 10); wk[k] = (wk[k] || 0) + est })
      Object.keys(wk).sort().forEach((k) => console.error(`  week ${k}: ${(wk[k] / 60).toFixed(1)}h`))
    }
    process.exit(1)
  }

  const planEnc = encodeURIComponent(PLAN)
  // delete existing rows of this plan (idempotent clean slate)
  const del = await fetch(`${SB_URL}/rest/v1/dsa_problems?plan=eq.${planEnc}`, { method: 'DELETE', headers: H })
  console.log('Deleted existing plan rows — status', del.status)

  // insert in batches of 100
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const r = await fetch(`${SB_URL}/rest/v1/dsa_problems`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(batch) })
    if (r.status >= 300) { console.error('INSERT failed', r.status, (await r.text()).slice(0, 300)); process.exit(1) }
    console.log(`Inserted rows ${i + 1}–${i + batch.length} (status ${r.status})`)
  }

  // ---- READ BACK + VERIFY ----
  const back = await (await fetch(`${SB_URL}/rest/v1/dsa_problems?plan=eq.${planEnc}&select=title,url,difficulty,topics,target_date&order=target_date`, { headers: H })).json()
  console.log('\n=== VERIFY (read back from Supabase) ===')
  console.log('Total rows in cloud for this plan:', back.length)

  // coverage per topic vs source
  const srcCounts = Object.fromEntries(BLOCKS.map((b) => [TOPIC_TAG[b.label], b.problems.length]))
  const gotCounts = {}
  back.forEach((r) => {
    const isMeta = ['Revision', 'Consolidation', 'Video'].some((t) => (r.topics || []).includes(t))
    if (isMeta) return
    const tag = (r.topics || [])[0]
    gotCounts[tag] = (gotCounts[tag] || 0) + 1
  })
  console.log('Coverage per topic (cloud vs source):')
  let coverageOk = true
  for (const [tag, n] of Object.entries(srcCounts)) {
    const got = gotCounts[tag] || 0
    const ok = got === n
    if (!ok) coverageOk = false
    console.log(`  ${tag.padEnd(16)} ${got}/${n} ${ok ? 'OK' : '❌ MISMATCH'}`)
  }

  // forbidden-day check
  const cls = Object.fromEntries(allDays.map((d) => [d.key, d.cls]))
  const bad = back.filter((r) => cls[r.target_date] === 'wed' || cls[r.target_date] === 'zero')
  console.log('Rows on Wednesdays/rest days (must be 0):', bad.length)

  // non-null URL check
  const noUrl = back.filter((r) => !r.url)
  console.log('Rows with null URL (must be 0):', noUrl.length)

  // date span
  const dates = back.map((r) => r.target_date).sort()
  console.log('Date span:', dates[0], '→', dates[dates.length - 1])

  const pass = coverageOk && bad.length === 0 && noUrl.length === 0
  console.log('\n' + (pass ? '✅ ALL CHECKS PASSED' : '❌ CHECKS FAILED'))
  process.exit(pass ? 0 : 1)
}
main().catch((e) => { console.error('FATAL', e); process.exit(1) })
