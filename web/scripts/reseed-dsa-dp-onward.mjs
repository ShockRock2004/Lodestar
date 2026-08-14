// Rebuild the "Placement DSA · Aug–Sep 2026" plan from DP onward, restarting on
// 2026-08-17. Recursion is done — its existing rows (Aug 3-9, including solved
// status) are left completely untouched. Everything else (DP, Graphs, Binary Trees,
// BST, Greedy, Sliding Window + the revision/quiz/consolidation days) is deleted and
// regenerated over the shorter Aug 17 -> Sep 30 runway.
//
// No problems are dropped: if the shorter runway can't fit everything at the normal
// daily budget, Friday and Monday get extra capacity (in steps) until it fits, rather
// than aborting or cutting content — same "does not fit -> widen Fri/Mon" contract as
// the original seed script had "does not fit -> abort".
//
// Run:  node web/scripts/reseed-dsa-dp-onward.mjs [--dry-run]
// Reads Supabase creds from web/.env.local (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DRY_RUN = process.argv.includes('--dry-run')
const __dir = dirname(fileURLToPath(import.meta.url))
const SRC = JSON.parse(readFileSync(join(__dir, 'placement-dsa-source.json'), 'utf8'))
const PLAN = SRC.plan

const env = readFileSync(join(__dir, '..', '.env.local'), 'utf8')
const grab = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim()
const SB_URL = grab('VITE_SUPABASE_URL')
const SB_KEY = grab('VITE_SUPABASE_ANON_KEY')
if (!SB_URL || !SB_KEY) { console.error('Missing Supabase env vars in web/.env.local'); process.exit(1) }
const H = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }

// =====================================================================
// 1) CALENDAR — classify Aug 17 – Sep 30 2026 into load classes
// =====================================================================
const FROZEN_KEYS = new Set(['recursion'])
const WINDOW_START = new Date(2026, 7, 17) // Aug 17
const WINDOW_END = new Date(2026, 8, 30)   // Sep 30

const REST_DAYS = new Set(['2026-08-31', '2026-09-02'])
const QUIZ_DAYS = new Set(['2026-09-01', '2026-09-03'])
const HOLIDAYS = new Set(['2026-08-26', '2026-09-14'])
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function classifyDays() {
  const days = []
  for (let d = new Date(WINDOW_START); d <= WINDOW_END; d.setDate(d.getDate() + 1)) {
    const key = iso(d), dow = d.getDay()
    let cls
    if (REST_DAYS.has(key)) cls = 'zero'
    else if (HOLIDAYS.has(key)) cls = 'holiday'
    else if (dow === 3) cls = 'wed'
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
const BASE_CAP = { normal: 180, weekend: 210, holiday: 240, quiz: 60 } // minutes/day
const BASE_WEEK_CAP = 1260 // 21h ceiling, same as the original schedule
const PMIN = { Easy: 20, Medium: 27, Hard: 45 }
const THEORY_MIN = 15
const VIDEO_MIN = 45
const REV_EVERY = 12
const REV_MIN = 120, QUIZ_LIGHT_MIN = 60, CONSOL_MIN = 180
const pmin = (p) => (p.difficulty ? PMIN[p.difficulty] : THEORY_MIN)
const weekOf = (key) => { const dt = new Date(key + 'T00:00:00'); const day = (dt.getDay() + 6) % 7; const mon = new Date(dt); mon.setDate(dt.getDate() - day); return iso(mon) }

const BLOCKS = Object.entries(SRC.topics)
  .filter(([key]) => !FROZEN_KEYS.has(key))
  .map(([key, t]) => ({ key, ...t }))
const TOPIC_TAG = {
  Recursion: 'Recursion', 'Dynamic Programming': 'DP', Graphs: 'Graphs',
  'Binary Trees': 'Trees', BST: 'BST', Greedy: 'Greedy', 'Sliding Window & Two Pointer': 'Sliding Window',
}

// `boost` extra minutes/day, applied only to normal-class Friday/Monday, to absorb
// whatever the shorter runway can't fit at the base budget.
function buildSchedule(boost) {
  const allDays = classifyDays()
  const work = allDays.filter((d) => BASE_CAP[d.cls] > 0).map((d) => {
    const boosted = d.cls === 'normal' && (d.dow === 'Fri' || d.dow === 'Mon')
    return { ...d, cap: BASE_CAP[d.cls] + (boosted ? boost : 0), used: 0, items: [], kind: 'content', boosted }
  })
  const consolidation = work.slice(-2)
  consolidation.forEach((d) => { d.kind = 'consolidation' })
  work.forEach((d) => { if (d.cls === 'quiz' && d.kind === 'content') d.kind = 'quiz-light' })
  const content = work.filter((d) => d.kind === 'content')

  const weekMin = {}
  const weekCapExtra = {}
  const addWeek = (key, m) => { const w = weekOf(key); weekMin[w] = (weekMin[w] || 0) + m }
  work.forEach((d) => { if (d.kind === 'quiz-light') addWeek(d.key, QUIZ_LIGHT_MIN); if (d.kind === 'consolidation') addWeek(d.key, CONSOL_MIN) })
  content.forEach((d) => { if (d.boosted) { const w = weekOf(d.key); weekCapExtra[w] = (weekCapExtra[w] || 0) + boost } })
  const weekCap = (w) => BASE_WEEK_CAP + (weekCapExtra[w] || 0)

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
        const weekHasRoom = (weekMin[wk] || 0) + need <= weekCap(wk)
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

// Widen Friday/Monday in 15-min steps until everything fits (cap the search so a real
// modeling bug aborts loudly instead of ballooning days forever).
function buildScheduleFitting() {
  for (let boost = 0; boost <= 600; boost += 15) {
    const res = buildSchedule(boost)
    if (res.overflow.length === 0) return { ...res, boost }
  }
  throw new Error('Could not fit the plan into Aug 17 - Sep 30 even with a 600min/day Fri/Mon boost')
}

// =====================================================================
// 3) EMIT ROWS — problems + leading video item + revision/quiz/consolidation
// =====================================================================
const STAMP = '2026-08-14T00:00:00.000Z'
const A2Z = 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/'
const slugOf = (u) => { const m = (u || '').match(/leetcode\.com\/problems\/([a-z0-9-]+)/i); return m ? m[1].toLowerCase() : null }
let seq = 0
const UID = () => { seq++; return '0a2a0001-0000-4000-8000-' + String(seq).padStart(12, '0') } // 0a2a0001 prefix so ids never collide with the frozen recursion rows (0a2a0000 prefix)
const mkRow = (o) => ({
  id: UID(), slug: o.slug ?? slugOf(o.url), title: o.title, url: o.url || null,
  difficulty: o.difficulty ?? null, topics: o.topics, notes: o.notes || '', status: 'todo',
  score: null, target_date: o.date, source: 'seed', plan: PLAN,
  created_at: STAMP, updated_at: STAMP, solved_at: null,
})

function emitRows() {
  const { work, overflow, allDays, boost } = buildScheduleFitting()
  const rows = []
  for (const d of work) {
    if (d.kind === 'revision') {
      rows.push(mkRow({ title: 'Revision & buffer — re-solve flagged/failed problems', url: A2Z, topics: ['Revision'], date: d.key, notes: 'Buffer day: re-attempt every problem you flagged this cycle from scratch. ~2h.' })); continue
    }
    if (d.kind === 'quiz-light') {
      rows.push(mkRow({ title: 'Light day (quiz) — quick revision + 1 warm-up', url: A2Z, topics: ['Revision', 'Light'], date: d.key, notes: 'Quiz at 08:00. Keep it light: skim yesterday’s solutions, re-attempt one flagged problem. ~1h.' })); continue
    }
    if (d.kind === 'consolidation') {
      rows.push(mkRow({ title: 'Consolidation — timed mixed set + full revision of weak areas', url: A2Z, topics: ['Consolidation'], date: d.key, notes: 'No new topics. Timed mixed set + revise DP/Graphs weak spots. ~3h.' })); continue
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
      if (d.boosted && i === 0) topics.push('extra')
      rows.push(mkRow({ slug: slugOf(it.url), title: it.title, url: it.url, difficulty: it.difficulty, topics, date: d.key }))
    })
  }
  return { rows, overflow, allDays, boost }
}

// =====================================================================
// 4) SEED SUPABASE — delete everything from Aug 17 onward (i.e. everything NOT
//    tagged Recursion), keep the frozen Recursion rows untouched, insert fresh.
// =====================================================================
async function main() {
  const { rows, overflow, allDays, boost } = emitRows()
  console.log(`Fitted with Fri/Mon boost = +${boost}min/day`)
  if (overflow.length) { console.error('ABORT — unexpected overflow:', overflow.length); process.exit(1) }

  const srcCounts = Object.fromEntries(BLOCKS.map((b) => [TOPIC_TAG[b.label], b.problems.length]))
  const gotCounts = {}
  rows.forEach((r) => {
    const isMeta = ['Revision', 'Consolidation', 'Video'].some((t) => (r.topics || []).includes(t))
    if (isMeta) return
    const tag = (r.topics || [])[0]
    gotCounts[tag] = (gotCounts[tag] || 0) + 1
  })
  console.log('Coverage per topic (new rows vs source, Recursion excluded):')
  let coverageOk = true
  for (const [tag, n] of Object.entries(srcCounts)) {
    const got = gotCounts[tag] || 0
    const ok = got === n
    if (!ok) coverageOk = false
    console.log(`  ${tag.padEnd(16)} ${got}/${n} ${ok ? 'OK' : '❌ MISMATCH'}`)
  }
  const cls = Object.fromEntries(allDays.map((d) => [d.key, d.cls]))
  const bad = rows.filter((r) => cls[r.target_date] === 'wed' || cls[r.target_date] === 'zero')
  const noUrl = rows.filter((r) => !r.url)
  const dates = rows.map((r) => r.target_date).sort()
  console.log('Total new rows:', rows.length)
  console.log('Date span:', dates[0], '→', dates[dates.length - 1])
  console.log('Rows on Wednesdays/rest days (must be 0):', bad.length)
  console.log('Rows with null URL (must be 0):', noUrl.length)
  const boostedDays = [...new Set(rows.filter((r) => (r.topics || []).includes('extra')).map((r) => r.target_date))]
  console.log('Boosted Fri/Mon days used:', boostedDays.length, boostedDays.slice(0, 10))

  const pass = coverageOk && bad.length === 0 && noUrl.length === 0
  if (!pass) { console.log('\n❌ CHECKS FAILED — aborting before touching Supabase'); process.exit(1) }
  console.log('\n✅ ALL CHECKS PASSED')

  if (DRY_RUN) { console.log('\n--dry-run: not touching Supabase.'); return }

  const planEnc = encodeURIComponent(PLAN)
  // Delete only the non-Recursion rows of this plan — Recursion (Aug 3-9, incl. solved
  // status) is frozen and must survive this reseed untouched.
  const del = await fetch(`${SB_URL}/rest/v1/dsa_problems?plan=eq.${planEnc}&topics=not.cs.%7BRecursion%7D`, { method: 'DELETE', headers: H })
  console.log('Deleted existing non-Recursion plan rows — status', del.status)
  if (del.status >= 300) { console.error(await del.text()); process.exit(1) }

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const r = await fetch(`${SB_URL}/rest/v1/dsa_problems`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(batch) })
    if (r.status >= 300) { console.error('INSERT failed', r.status, (await r.text()).slice(0, 300)); process.exit(1) }
    console.log(`Inserted rows ${i + 1}–${i + batch.length} (status ${r.status})`)
  }

  const back = await (await fetch(`${SB_URL}/rest/v1/dsa_problems?plan=eq.${planEnc}&select=id,topics,status,target_date`, { headers: H })).json()
  console.log('\n=== VERIFY (read back from Supabase) ===')
  console.log('Total rows in cloud for this plan now:', back.length, '(expect', rows.length + 31, '= new + frozen Recursion)')
  const recBack = back.filter((r) => (r.topics || []).includes('Recursion'))
  console.log('Frozen Recursion rows still present:', recBack.length, 'solved:', recBack.filter((r) => r.status === 'solved').length)
}
main().catch((e) => { console.error('FATAL', e); process.exit(1) })
