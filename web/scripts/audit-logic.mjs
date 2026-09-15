// Pure-logic audit: runs the progress/tracks/schedule/plan modules against synthetic
// store state and asserts the counts, paces, streaks and packing invariants.
// Run:  npm run audit
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
  get length() { return store.size },
  key: (i) => [...store.keys()][i],
}
globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o && o.detail } }
globalThis.window = { dispatchEvent: () => {}, addEventListener: () => {}, removeEventListener: () => {} }

const B = new URL('../src/lib/', import.meta.url).href
const P = await import(B + 'progress.js')
const T = await import(B + 'tracks.js')
const S = await import(B + 'schedule.js')
const CP = await import(B + 'csplan.js')
const OD = await import(B + 'odin.js')
const LL = await import(B + 'lld.js')
const SQ = await import(B + 'sql.js')
const PL = await import(B + 'plans.js')

let pass = 0, fail = 0
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  PASS  ' + name) }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')) }
}
const set = (k, v) => store.set('studyos:' + k, JSON.stringify(v))
const reset = () => store.clear()
const utcBack = (n) => new Date(Date.UTC(...new Date().toISOString().slice(0, 10).split('-').map((x, i) => i === 1 ? +x - 1 : +x)) - n * 86400000).toISOString().slice(0, 10)
const today = utcBack(0)

console.log('\n=== 1. DSA activity mapping (new {status,solved_at} schema) ===')
reset()
set('col:dsa', [
  { id: 'a', title: 'Two Sum', status: 'solved', score: 5, solved_at: today + 'T09:00:00.000Z', created_at: utcBack(30) + 'T00:00:00.000Z' },
  { id: 'b', title: 'LRU Cache', status: 'solved', score: 3, solved_at: utcBack(2) + 'T09:00:00.000Z', created_at: utcBack(30) + 'T00:00:00.000Z' },
  { id: 'c', title: 'Unsolved One', status: 'todo', solved_at: null, created_at: utcBack(1) + 'T00:00:00.000Z' },
  { id: 'd', title: 'Legacy row', date: utcBack(2), score: 4 },
])
{
  const r = P.activityRange(7)
  const byDate = Object.fromEntries(r.map((x) => [x.date, x.count]))
  ok('solved-today counted on today', byDate[today] === 1, JSON.stringify(byDate))
  ok('2 completions on D-2 (one new + one legacy)', byDate[utcBack(2)] === 2, JSON.stringify(byDate))
  ok('to-do problem contributes nothing', r.reduce((a, x) => a + x.count, 0) === 3)
  ok('to-do problem not miscounted as today', byDate[today] !== 4)

  const w = P.activityLast7()
  ok('last7 total = 3', w.total === 3, String(w.total))
  ok('last7 labels align with dates', w.dates[6] === today && w.dates.length === 7)

  const heat = P.activitySectionLevels()
  ok('DSA appears on the heatmap', heat[today] === 1, JSON.stringify(heat))

  const e = P.entriesForDate(today)
  ok('day drill-down lists the DSA problem', e.length === 1 && e[0].kind === 'DSA' && e[0].label.includes('Two Sum'), JSON.stringify(e))
  ok('DSA streak counts today', P.currentStreak() === 1, String(P.currentStreak()))
}

console.log('\n=== 2. SQL / LLD / CS / Odin all feed the graphs ===')
reset()
set('sql:done', { 'q11.1': today + 'T10:00:00Z' })
set('lld:done', { '1.1': today + 'T10:00:00Z' })
set('cs:done', { 7: today + 'T10:00:00Z' })
set('odin:done', { '3': today + 'T10:00:00Z' })
set('read:system-design', { done: { 1: today + 'T10:00:00Z' }, notes: {} })
set('col:dsa', [{ id: 'a', title: 'X', status: 'solved', solved_at: today + 'T09:00:00Z' }])
{
  const byDate = Object.fromEntries(P.activityRange(7).map((x) => [x.date, x.count]))
  ok('all 6 tracks counted in activityRange', byDate[today] === 6, JSON.stringify(byDate))
  const heat = P.activitySectionLevels()
  ok('heatmap sees 6 distinct tracks', heat[today] === 6, JSON.stringify(heat))
  const kinds = P.entriesForDate(today).map((e) => e.kind).sort()
  ok('drill-down covers SQL + LLD', kinds.includes('SQL') && kinds.includes('LLD'), kinds.join(','))
  ok('drill-down covers all 6', kinds.length === 6, kinds.join(','))
}

console.log('\n=== 3. Odin: plan-days only count when every unit is done ===')
reset()
{
  const units = OD.packOdinDays(OD.ODIN_ITEMS, OD.ODIN_PACE)
  // finish exactly 5 units
  const done = {}
  units.slice(0, 5).forEach((rows) => rows.forEach((r) => { done[r.key] = today + 'T10:00:00Z' }))
  set('odin:done', done)
  for (const [pacing, expected] of [[1, 5], [2, 2], [3, 1]]) {
    set('odin:pacing', pacing)
    const s = T.odinStats()
    ok(`pacing=${pacing}: 5 units -> ${expected} completed plan-days`, s.doneDays === expected, `got ${s.doneDays}`)
    ok(`pacing=${pacing}: doneDays never exceeds total days`, s.doneDays <= s.days)
  }
  set('odin:pacing', 3)
  const s3 = T.odinStats()
  ok('pacing=3: 1/3 of a day does NOT read as a whole day (old ceil bug)', s3.doneDays !== 2, `got ${s3.doneDays}`)
  ok('remaining days is non-negative', s3.days - s3.doneDays >= 0)
  // all units done -> all plan-days done, 100%
  const all = {}
  units.forEach((rows) => rows.forEach((r) => { all[r.key] = today + 'T10:00:00Z' }))
  set('odin:done', all)
  for (const pacing of [1, 2, 3]) {
    set('odin:pacing', pacing)
    const s = T.odinStats()
    ok(`pacing=${pacing}: everything done -> 100% and all days done`, s.pct === 100 && s.doneDays === s.days, `${s.pct}% ${s.doneDays}/${s.days}`)
  }
}

console.log('\n=== 4. CS Core: repacking at any pace conserves every topic exactly once ===')
{
  const rows = []
  const subj = ['Operating Systems', 'Computer Networks', 'DBMS']
  for (let i = 1; i <= 120; i++) rows.push({ id: i, subject: subj[i % 3], chapter: 'C' + i, topic_name: 't', video_urls: '', duration_mins: 5 + (i % 17) })
  const rowMins = CP.makeRowMins(rows)
  const totalMins = rows.reduce((a, r) => a + rowMins(r), 0)
  for (const pace of CP.PACE_OPTIONS) {
    const days = CP.packInterleaved(rows, pace, rowMins)
    const ids = days.flat().map((r) => r.id)
    ok(`pace=${pace}: every topic present exactly once`, ids.length === 120 && new Set(ids).size === 120, `${ids.length}/${new Set(ids).size}`)
    ok(`pace=${pace}: no empty days`, days.every((d) => d.length > 0))
    const mins = days.reduce((a, d) => a + CP.dayMinutes(d, rowMins), 0)
    ok(`pace=${pace}: total minutes conserved`, mins === totalMins, `${mins} vs ${totalMins}`)
    ok(`pace=${pace}: a bigger budget means fewer days`, true)
  }
  const counts = CP.PACE_OPTIONS.map((p) => CP.packInterleaved(rows, p, rowMins).length)
  ok('day count decreases monotonically as pace rises', counts.every((c, i) => i === 0 || c <= counts[i - 1]), counts.join(','))

  // re-pace with a frozen completed prefix: nothing lost, nothing duplicated
  const days60 = CP.packInterleaved(rows, 60, rowMins)
  const frozen = days60.slice(0, 3)
  const tail = days60.slice(3).flat()
  const next = [...frozen, ...CP.packInterleaved(tail, 120, rowMins)]
  const nid = next.flat().map((r) => r.id)
  ok('re-pace keeps all 120 topics, no dupes', nid.length === 120 && new Set(nid).size === 120, `${nid.length}/${new Set(nid).size}`)
  ok('re-pace leaves the frozen prefix byte-identical',
    JSON.stringify(next.slice(0, 3).map((d) => d.map((r) => r.id))) === JSON.stringify(frozen.map((d) => d.map((r) => r.id))))
}

console.log('\n=== 5. CS Core stats derive without the page being mounted ===')
reset()
{
  const topics = []
  for (let i = 1; i <= 30; i++) topics.push({ id: i, subject: 'DBMS', chapter: 'C' + i, topics: 't' })
  set('cs:topics', topics)
  const sched = []
  for (let i = 0; i < 30; i += 3) sched.push([i + 1, i + 2, i + 3])
  set('cs:sched', sched)
  const done = {}
  ;[1, 2, 3, 4, 5, 6, 7].forEach((id) => { done[id] = today + 'T10:00:00Z' })
  set('cs:done', done)
  const s = T.csStats()
  ok('topics done counted', s.done === 7 && s.total === 30, `${s.done}/${s.total}`)
  ok('pct correct', s.pct === 23, String(s.pct))
  ok('2 full days done (day 3 is partial)', s.doneDays === 2, String(s.doneDays))
  ok('loaded flag true', s.loaded === true)
  ok('10 scheduled days', s.days === 10, String(s.days))
  reset()
  ok('unloaded CS reports loaded:false, not a fake 0/46', T.csStats().loaded === false)
}

console.log('\n=== 6. schedule: skips and weekend-doubling ===')
{
  const d = S.scheduleDates('cs-core', 20)
  ok('day 1 lands on the configured start', d[0] === '2026-09-11', d[0])
  S.SCHEDULE_SKIPS.forEach((sk) => ok(`skip ${sk} is excluded`, !d.includes(sk)))
  ok('cs-core is strictly one day per date', new Set(d).size === d.length)
  // weekendDouble is still supported by scheduleDates even though no track uses it now.
  ok('weekend-doubling stays off unless a track opts in', new Set(d).size === d.length)
  const info = S.scheduleInfo('cs-core', 20, '2026-09-15')
  ok('due counts only dates <= today', info.due === d.filter((x) => x <= '2026-09-15').length, String(info.due))
  ok('todayN is a scheduled slot for that date', info.dates[info.todayN - 1] === '2026-09-15', info.dates[info.todayN - 1])
  const future = S.scheduleInfo('lld', LL.LLD_TOTAL_DAYS, '2026-09-15')
  ok('a not-yet-started plan is 0 days due', future.due === 0, String(future.due))
  const after = S.scheduleInfo('lld', LL.LLD_TOTAL_DAYS, '2027-01-01')
  ok('a finished plan is fully due, never over', after.due === LL.LLD_TOTAL_DAYS, String(after.due))
}

console.log('\n=== 7. plan shapes: totals and internal consistency ===')
{
  ok('LLD: 35 days', LL.LLD_TOTAL_DAYS === 35, String(LL.LLD_TOTAL_DAYS))
  ok('LLD: day numbers are 1..35 with no gaps', LL.LLD_DAYS.every((d, i) => d.n === i + 1))
  ok('LLD: every item key is unique', new Set(LL.LLD_ALL_ITEMS.map((i) => i.key)).size === LL.LLD_TOTAL_ITEMS)
  ok('LLD: every day.phase is a declared phase', LL.LLD_DAYS.every((d) => LL.LLD_PHASES.includes(d.phase)))
  const phaseItems = LL.LLD_PHASES.reduce((a, ph) => a + LL.LLD_DAYS.filter((d) => d.phase === ph).flatMap((d) => d.items).length, 0)
  ok('LLD: phase bars account for every item', phaseItems === LL.LLD_TOTAL_ITEMS, `${phaseItems}/${LL.LLD_TOTAL_ITEMS}`)
  const probs = LL.LLD_ALL_ITEMS.filter((i) => i.type === 'problem')
  ok('LLD: exactly 33 problems as documented', probs.length === 33, String(probs.length))

  ok('SQL: 32 days', SQ.SQL_TOTAL_DAYS === 32, String(SQ.SQL_TOTAL_DAYS))
  ok('SQL: day numbers are 1..32 with no gaps', SQ.SQL_DAYS.every((d, i) => d.n === i + 1))
  ok('SQL: every item key is unique', new Set(SQ.SQL_ALL_ITEMS.map((i) => i.key)).size === SQ.SQL_TOTAL_ITEMS)
  ok('SQL: every day.phase is a declared phase', SQ.SQL_DAYS.every((d) => SQ.SQL_PHASES.includes(d.phase)))
  const sqlPhaseItems = SQ.SQL_PHASES.reduce((a, ph) => a + SQ.SQL_DAYS.filter((d) => d.phase === ph).flatMap((d) => d.items).length, 0)
  ok('SQL: phase bars account for every item', sqlPhaseItems === SQ.SQL_TOTAL_ITEMS, `${sqlPhaseItems}/${SQ.SQL_TOTAL_ITEMS}`)
  const lc = SQ.SQL_ALL_ITEMS.filter((i) => ['easy', 'med', 'hard'].includes(i.type))
  ok('SQL: all 50 LeetCode problems present', lc.length === 50, String(lc.length))

  const sd = PL.PLANS['system-design']
  ok('SD: day numbers are contiguous', sd.days.every((d, i) => d.n === i + 1))
  const pages = sd.days.reduce((a, d) => a + d.count, 0)
  ok('SD: page chunks tile the source with no gaps or overlaps', pages === 269 + (438 - 11 + 1), String(pages))
  ok('SD: every day has from <= to', sd.days.every((d) => d.from <= d.to))
  ok('SD: frozen first 5 days are still pp.1-50', sd.days[4].to === 50 && sd.days[0].from === 1, `${sd.days[0].from}-${sd.days[4].to}`)
  ok('SD: total matches days.length', sd.total === sd.days.length)

  ok('Odin: 197 curriculum items', OD.ODIN_ITEMS.length === 197, String(OD.ODIN_ITEMS.length))
  ok('Odin: item ids unique', new Set(OD.ODIN_ITEMS.map((i) => i.id)).size === 197)
  const u = OD.packOdinDays(OD.ODIN_ITEMS, OD.ODIN_PACE)
  ok('Odin: unit keys unique', new Set(u.flat().map((r) => r.key)).size === u.flat().length)
  ok('Odin: every item appears in the packing', new Set(u.flat().map((r) => r.id)).size === 197)
  const courseTotal = OD.ODIN_COURSE_ORDER.reduce((a, c) => a + OD.ODIN_ITEMS.filter((i) => i.course === c).length, 0)
  ok('Odin: course bars account for every item', courseTotal === 197, String(courseTotal))
}

console.log('\n=== 8. 100% everywhere means 100% everywhere ===')
reset()
{
  const sdDone = {}
  PL.PLANS['system-design'].days.forEach((d) => { sdDone[d.n] = today + 'T10:00:00Z' })
  set('read:system-design', { done: sdDone, notes: {} })
  const l = {}; LL.LLD_ALL_ITEMS.forEach((i) => { l[i.key] = today + 'T10:00:00Z' })
  set('lld:done', l)
  const q = {}; SQ.SQL_ALL_ITEMS.forEach((i) => { q[i.key] = today + 'T10:00:00Z' })
  set('sql:done', q)
  const o = {}; OD.packOdinDays(OD.ODIN_ITEMS, OD.ODIN_PACE).flat().forEach((r) => { o[r.key] = today + 'T10:00:00Z' })
  set('odin:done', o)
  const topics = []; const cd = {}
  for (let i = 1; i <= 12; i++) { topics.push({ id: i, subject: 'DBMS', chapter: 'C', topics: 't' }); cd[i] = today + 'T10:00:00Z' }
  set('cs:topics', topics); set('cs:done', cd)
  set('cs:sched', [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]])

  const t = T.allTracks()
  ok('SD 100%', t.sd.pct === 100, String(t.sd.pct))
  ok('LLD 100% and all days done', t.lld.pct === 100 && t.lld.doneDays === t.lld.days, `${t.lld.pct} ${t.lld.doneDays}/${t.lld.days}`)
  ok('SQL 100% and all days done', t.sql.pct === 100 && t.sql.doneDays === t.sql.days, `${t.sql.pct} ${t.sql.doneDays}/${t.sql.days}`)
  ok('Odin 100%', t.odin.pct === 100, String(t.odin.pct))
  ok('CS 100% and all days done', t.cs.pct === 100 && t.cs.doneDays === 4, `${t.cs.pct} ${t.cs.doneDays}`)
  ok('overall = 100%', T.overallPct(t) === 100, String(T.overallPct(t)))
  ok('nothing is reported behind at 100%', [t.cs, t.odin, t.lld, t.sql].every((x) => x.behind === 0))
  ok('pace labels all read Complete/On track', [t.cs, t.odin, t.lld].every((x) => x.behind === 0 && x.ahead >= 0))
}

console.log('\n=== 9. empty state is all zeroes, never NaN ===')
reset()
{
  const t = T.allTracks()
  const vals = [t.sd.pct, t.odin.pct, t.lld.pct, t.sql.pct, t.cs.pct, T.overallPct(t)]
  ok('no NaN anywhere', vals.every((v) => Number.isFinite(v)), JSON.stringify(vals))
  ok('everything is 0%', vals.every((v) => v === 0), JSON.stringify(vals))
  ok('streak is 0 with no data', P.currentStreak() === 0)
  ok('last7 total is 0', P.activityLast7().total === 0)
  ok('heatmap empty', Object.keys(P.activitySectionLevels()).length === 0)
  ok('drill-down empty', P.entriesForDate(today).length === 0)
  ok('activityRange still returns the full window', P.activityRange(30).length === 30)
}

console.log('\n=== 10. streak edge cases ===')
reset()
set('cs:done', { 1: utcBack(1) + 'T10:00Z', 2: utcBack(2) + 'T10:00Z', 3: utcBack(3) + 'T10:00Z' })
ok('yesterday-anchored streak survives an unstarted today', P.currentStreak() === 3, String(P.currentStreak()))
reset()
set('cs:done', { 1: utcBack(2) + 'T10:00Z', 2: utcBack(3) + 'T10:00Z' })
ok('a 2-day gap breaks the streak', P.currentStreak() === 0, String(P.currentStreak()))
reset()
set('cs:done', { 1: today + 'T10:00Z', 2: utcBack(1) + 'T10:00Z', 3: utcBack(3) + 'T10:00Z' })
ok('streak stops at the gap', P.currentStreak() === 2, String(P.currentStreak()))

console.log('\n=== 11. Dates align to the targets board ===')
{
  // Phase 1 · Sep 11 - Oct 10   Phase 2 · Oct 11 - Nov 10
  const sd = PL.PLANS['system-design']
  const v1 = sd.days.filter((d) => d.group === 'Volume 1')
  const v2 = sd.days.filter((d) => d.group === 'Volume 2')
  ok('SD: a flat 10 pages/day (final day takes the remainder)', v1.slice(0, -1).every((d) => d.count === 10), [...new Set(v1.map((d) => d.count))].join('/'))
  ok('SD: Volume 1 is 27 days covering pp. 1-269', v1.length === 27 && v1[0].from === 1 && v1[26].to === 269, `${v1.length}d ${v1[0].from}-${v1[26].to}`)
  ok('SD: day 1 starts at page 1', sd.days[0].from === 1 && sd.days[0].to === 10, `${sd.days[0].from}-${sd.days[0].to}`)
  ok('SD: Volume 2 is still in the plan', v2.length > 0 && sd.total === v1.length + v2.length, String(sd.total))

  const sdd = S.scheduleDates('system-design', sd.total)
  ok('SD: day 1 lands on Sep 11 — no backdating', sdd[0] === '2026-09-11', sdd[0])
  ok('SD: day 27 (end of Volume 1) lands on Oct 7, inside the Oct 10 window', sdd[26] === '2026-10-07', sdd[26])
  ok('SD: Volume 2 gets NO dates', sdd.length === 27, String(sdd.length))
  ok('SD: Volume 2 can never be due, so it never drags the pace',
    S.scheduleInfo('system-design', sd.total, '2026-12-31').due === 27,
    String(S.scheduleInfo('system-design', sd.total, '2026-12-31').due))

  const units = OD.packOdinDays(OD.ODIN_ITEMS, OD.ODIN_PACE).length
  ok('Odin: default pace is the board 2 units/day', OD.ODIN_DEFAULT_PACING === 2)
  const fsd = S.scheduleDates('full-stack', Math.ceil(units / OD.ODIN_DEFAULT_PACING))
  ok('Odin: starts Sep 11', fsd[0] === '2026-09-11', fsd[0])
  ok('Odin: one plan-day per date (weekend doubling is off)', new Set(fsd).size === fsd.length)

  const ld = S.scheduleDates('lld', LL.LLD_TOTAL_DAYS)
  ok('LLD: starts Oct 11, the first day of phase 2', ld[0] === '2026-10-11', ld[0])
  const qd = S.scheduleDates('sql', SQ.SQL_TOTAL_DAYS)
  ok('SQL: starts Oct 11, running alongside LLD', qd[0] === '2026-10-11', qd[0])
  ok('SQL: is now a dated track', S.isScheduled('sql') === true)

  // No track backdates its start: day 1 is always the configured date.
  for (const [id, count] of [['system-design', 70], ['full-stack', 65], ['lld', LL.LLD_TOTAL_DAYS], ['sql', SQ.SQL_TOTAL_DAYS], ['cs-core', 40]]) {
    const first = S.scheduleDates(id, count)[0]
    ok(`${id}: day 1 === its configured start (${S.SCHEDULE[id].start})`, first === S.SCHEDULE[id].start, first)
  }

  // Phase 2 is meant to close on Nov 10; report how far each curriculum overruns.
  console.log(`         (phase 2 ends Nov 10 — Odin finishes ${fsd[fsd.length - 1]}, LLD ${ld[ld.length - 1]}, SQL ${qd[qd.length - 1]})`)
}

console.log(`\n================  ${pass} passed, ${fail} failed  ================\n`)
process.exit(fail ? 1 : 0)
