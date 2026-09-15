import './smoke-setup.mjs'
/* eslint-disable */
// Mounts every route in a real DOM against three seeded store states and asserts the
// rendered text — so a broken import, a stale field name or a NaN counter fails here
// instead of silently in the browser.  Run:  npm run smoke
import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import CryptgenBento from '../src/pages/CryptgenBento.jsx'
import Dashboard from '../src/pages/Dashboard.jsx'
import Dsa from '../src/pages/Dsa.jsx'
import DsaPlan from '../src/pages/DsaPlan.jsx'
import CsCore from '../src/pages/CsCore.jsx'
import SystemDesign from '../src/pages/SystemDesign.jsx'
import Search from '../src/pages/Search.jsx'
import Odin from '../src/pages/Odin.jsx'
import Lld from '../src/pages/Lld.jsx'
import Sql from '../src/pages/Sql.jsx'
import Checklist from '../src/pages/Checklist.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const PAGES = [
  ['/', CryptgenBento], ['/overview', Dashboard], ['/dsa', Dsa],
  ['/dsa/plan/Grind%2075', DsaPlan], ['/cs-core', CsCore], ['/system-design', SystemDesign],
  ['/search', Search], ['/full-stack', Odin], ['/lld', Lld], ['/sql', Sql], ['/checklist', Checklist],
]

const today = new Date().toISOString().slice(0, 10)
const back = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
const set = (k, v) => localStorage.setItem('studyos:' + k, JSON.stringify(v))
const stamp = (d) => d + 'T10:00:00.000Z'

function seed(kind) {
  localStorage.clear()
  if (kind === 'empty') return
  set('read:system-design', { done: { 1: stamp(back(4)), 2: stamp(back(3)), 3: stamp(back(2)) }, notes: { 2: 'note' } })
  set('cs:done', { 1: stamp(back(2)), 2: stamp(back(2)), 3: stamp(today) })
  set('cs:topics', Array.from({ length: 24 }, (_, i) => ({ id: i + 1, subject: ['Operating Systems', 'Computer Networks', 'DBMS'][i % 3], chapter: 'C' + (i + 1), topics: 'topic' })))
  set('cs:sched', Array.from({ length: 8 }, (_, i) => [i * 3 + 1, i * 3 + 2, i * 3 + 3]))
  set('cs:pace', kind === 'full' ? 120 : 60)
  set('odin:done', { 1: stamp(back(5)), 2: stamp(back(4)), 3: stamp(back(1)) })
  set('odin:pacing', kind === 'full' ? 3 : 2)
  set('lld:done', { '1.1': stamp(today), '1.2': stamp(today), '1.3': stamp(today) })
  set('lld:notes', { 1: 'ok' })
  set('sql:done', { c1: stamp(back(1)), 'q11.1': stamp(today) })
  set('sql:notes', { 1: 'ok' })
  set('col:dsa', [
    { id: 'a', slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topics: ['Array'], status: 'solved', score: 5, plan: 'Grind 75', solved_at: stamp(today), created_at: stamp(back(9)), target_date: back(1) },
    { id: 'b', slug: '3sum', title: '3Sum', difficulty: 'Medium', topics: ['Array'], status: 'todo', score: null, plan: 'Grind 75', solved_at: null, created_at: stamp(back(9)), target_date: today },
    { id: 'c', slug: 'lru-cache', title: 'LRU Cache', difficulty: 'Hard', topics: [], status: 'solved', score: 2, plan: 'My problems', solved_at: stamp(back(2)), created_at: stamp(back(9)), target_date: null },
    { id: 'd', title: 'Legacy row', date: back(3), score: 4, plan: 'My problems' },
  ])
  set('col:contests', [{ id: 'r1', platform: 'LeetCode', name: 'Weekly 400', starts_at: new Date(Date.now() + 86400000).toISOString(), remind_before_mins: 60 }])
  set('checklists', [{ id: 'l1', title: 'Today', created: stamp(today), date: today, items: [
    { id: 'i1', text: 'Revise DP', done: false, doneAt: null, start: 540, end: 600, urgent: true },
    { id: 'i2', text: 'Mock interview', done: true, doneAt: stamp(today), start: null, end: null, urgent: false },
  ] }])
  set('dsa:seeded', true)
  set('dsa:weekgoal', 5)
}

let pass = 0, fail = 0
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  PASS  ' + n) } else { fail++; console.log('  FAIL  ' + n + (x ? '  -> ' + x : '')) } }

const errs = []
const realError = console.error
console.error = (...a) => {
  const s = a.map(String).join(' ')
  if (!/useLayoutEffect|validateDOMNesting|not wrapped in act|defaultProps|Warning: React/.test(s)) errs.push(s)
}

async function mountAsync(path, Page) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/dsa/plan/:name', element: React.createElement(Page) }),
        React.createElement(Route, { path: '*', element: React.createElement(Page) }))))
  })
  await act(async () => { await new Promise((r) => setTimeout(r, 750)) })
  const text = host.textContent || ''
  await act(async () => root.unmount())
  host.remove()
  return text
}

console.log('\n=== Every route mounts, in three store states ===')
for (const kind of ['empty', 'seeded', 'full']) {
  for (const [path, Page] of PAGES) {
    seed(kind)
    errs.length = 0
    let text = ''
    try { text = await mountAsync(path, Page) } catch (e) { fail++; console.log(`  FAIL  [${kind}] ${path} — threw: ${e && e.message}`); continue }
    const bad = /NaN|undefined|Infinity/.test(text)
    if (bad) { fail++; console.log(`  FAIL  [${kind}] ${path} — NaN/undefined/Infinity in output`) }
    else if (errs.length) { fail++; console.log(`  FAIL  [${kind}] ${path} — ${errs[0].slice(0, 150)}`) }
    else { pass++; console.log(`  PASS  [${kind}] ${path} — ${text.length} chars`) }
  }
}

console.log('\n=== Rendered figures match the seeded data ===')
const flat = (s) => s.replace(/\s+/g, ' ')

seed('seeded')
{
  // /overview prints one line per track, so it is where the cross-track numbers
  // are checkable; home shows the same tracks as icons.
  const o = flat(await mountAsync('/overview', Dashboard))
  ok('DSA tile: 3 of 4 solved = 75%', /DSA3\/4 solved75%/.test(o), o.match(/DSA[^C]*/)?.[0])
  ok('CS Core tile: 3 of 24 topics = 13%', /CS Core3\/24 topics13%/.test(o), o.match(/CS Core[^S]*/)?.[0])
  // 70 plan days = Volume 1's 27 dated days + Volume 2's 43 undated ones.
  ok('System Design tile: Day 4 of 70 = 4%', /System DesignDay 4 \/ 704%/.test(o), o.match(/System DesignDay \d+ \/ \d+\d?%/)?.[0])
  ok('Full Stack tile: 3 of 197 items = 2%', /Full Stack3\/197 items2%/.test(o))
  ok('LLD tile: 1 of 35 days', /Low Level Design1\/35 days/.test(o))
  ok('SQL tile: 1 of 32 days', /SQL1\/32 days/.test(o))
  ok('overall = mean of the five percentage tracks (5%)', /5%overall/.test(o), o.match(/\d+%overall/)?.[0])
  ok('6 completions counted for today across all tracks', /6 done today/.test(o), o.match(/\d+ done today/)?.[0])
  ok('17 completions counted over the last 7 days', /17 tasks/.test(o), o.match(/\d+ tasks/)?.[0])
  ok('streak spans all 6 consecutive active days', /6-day streak/.test(o), o.match(/\d+-day streak/)?.[0])
}
{
  const h = flat(await mountAsync('/', CryptgenBento))
  ok('home shows CS Core pace from its calendar, not a hardcoded "Self-paced"', /CS Core4d behind/.test(h) && !/Self-paced/.test(h), h.match(/CS Core[^S]*/)?.[0])
  ok('home shows Full Stack pace, not a hardcoded "4-month plan"', /Full Stack5d behind/.test(h) && !/4-month/.test(h), h.match(/Full Stack\d+d \w+/)?.[0])
  ok('home shows System Design measured against Volume 1 only', /System Design2d behind/.test(h), h.match(/System Design\d+d \w+/)?.[0])
  ok('LLD and SQL are not yet due, so neither is flagged behind', !/Low Level Design\d+d behind/.test(h) && !/SQL\d+d behind/.test(h))
  ok('home today-ring counts the DSA problem solved today (1/2)', /1\/2today/.test(h), h.match(/\d\/\dtoday/)?.[0])
  ok('home resume band names the worst-behind track', /behind on Full Stack/.test(h), h.match(/behind on [A-Za-z ]+/)?.[0])
  ok('home renders no NaN', !/NaN/.test(h))
}
{
  const d = flat(await mountAsync('/dsa', Dsa))
  ok('DSA: 3 solved (2 modern rows + 1 legacy `date` row)', /3Solved/.test(d), d.match(/\d+Solved/)?.[0])
  ok('DSA: 1 to-do', /1To-do/.test(d))
  ok('DSA: 3 this week (calendar window, not a 144h cutoff)', /3This week/.test(d), d.match(/\d+This week/)?.[0])
  ok('DSA: avg score 3.7 across the 3 solved', /3\.7Avg score/.test(d), d.match(/[\d.]+Avg score/)?.[0])
  ok('DSA: per-plan counts split correctly', /Grind 751\/2/.test(d) && /My problems2\/2/.test(d))
  ok('DSA: consistency chart sees 3 active days', /3 active days/.test(d), d.match(/\d+ active days/)?.[0])
}
{
  const l = flat(await mountAsync('/lld', Lld))
  ok('LLD: 1 of 35 days, 3 items done', /1 of 35 days · 3 items done/.test(l), l.match(/\d+ of 35 days[^O]*/)?.[0])
  ok('LLD: focus lands on the first unfinished day (Day 2)', /Day 2 \/ 35 days/.test(l), l.match(/Day \d+ \/ 35 days/)?.[0])
  ok('LLD: phase bar reflects the 3 done OOP items', /OOP Foundations18%/.test(l), l.match(/OOP Foundations\d+%/)?.[0])
}
{
  const q = flat(await mountAsync('/sql', Sql))
  ok('SQL: 1 of 32 days, 2 items done', /1 of 32 days · 2 items done/.test(q), q.match(/\d+ of 32 days[^S]*/)?.[0])
  ok('SQL: now shows its phase-2 window', /Oct 11 – Nov 11/.test(q), q.match(/SQL prep · [^0-9]*[\d –-]*/)?.[0])
  ok('SQL: reports pace against its calendar, not "Self-paced"', /1d ahead/.test(q) && !/Self-paced/.test(q), q.match(/\d+d (ahead|behind)/)?.[0])
  ok('SQL: focus lands on the first unfinished day (Day 2)', /Day 2 \/ 32/.test(q), q.match(/Day \d+ \/ 32/)?.[0])
}

console.log('\n=== Full Stack: changing pace re-maps days without changing totals ===')
for (const pacing of [1, 2, 3]) {
  seed('seeded')
  set('odin:pacing', pacing)
  const t = flat(await mountAsync('/full-stack', Odin))
  const label = pacing === 1 ? '1 unit/day' : `${pacing} units/day`
  ok(`pacing=${pacing}: page states the chosen pace`, t.includes(label), t.match(/\d units?\/day/)?.[0])
  ok(`pacing=${pacing}: item count is pace-independent (3 of 197)`, /3 of 197 items/.test(t), t.match(/\d+ of 197 items/)?.[0])
  const days = Number((t.match(/finishes in (\d+) days/) || [])[1])
  const expect = Math.ceil(129 / pacing)
  ok(`pacing=${pacing}: plan length = ceil(units/pace) = ${expect}`, days === expect, String(days))
  ok(`pacing=${pacing}: percentage is unchanged by pacing`, /2%/.test(t))
  ok(`pacing=${pacing}: no NaN`, !/NaN/.test(t))
}

console.log('\n=== CS Core: every pace option renders cleanly ===')
for (const pace of [30, 60, 90, 120]) {
  seed('seeded')
  set('cs:pace', pace)
  localStorage.removeItem('studyos:cs:sched')
  const t = flat(await mountAsync('/cs-core', CsCore))
  ok(`pace=${pace}: renders with no NaN/undefined`, !/NaN|undefined/.test(t))
}

console.log(`\n================  ${pass} passed, ${fail} failed  ================\n`)
process.exit(fail ? 1 : 0)
