import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBack, IconSearch } from '../components/icons.jsx'
import { PLANS } from '../lib/plans.js'
import { getStore } from '../lib/store.js'
import { ODIN_ITEMS } from '../lib/odin.js'

const ROUTES = {
  'system-design': { to: '/system-design', label: 'System Design' },
  math: { to: '/ml-quant', label: 'ML · Quant · Math' },
  handson: { to: '/ml-quant', label: 'ML · Quant · Hands-On' },
}
const SCOPES = [
  { k: 'all', label: 'All' },
  { k: 'reading', label: 'Reading' },
  { k: 'cs', label: 'CS Core' },
  { k: 'quant', label: 'Quant' },
  { k: 'dsa', label: 'DSA' },
  { k: 'contest', label: 'Contests' },
  { k: 'odin', label: 'Full Stack' },
]
const EXAMPLES = ['consistent hashing', 'PCA', 'probability', 'two pointer', 'Codeforces']

function buildDocs() {
  const docs = []
  Object.values(PLANS).forEach((plan) => {
    const r = ROUTES[plan.id]
    const st = getStore(`read:${plan.id}`, { notes: {} })
    plan.days.forEach((d) => docs.push({
      scope: 'reading', section: r.label, to: r.to,
      title: `Day ${d.n} · ${d.chapters.join(' · ')}`, sub: `pp. ${d.from}–${d.to}`,
      text: `${plan.title} day ${d.n} ${d.chapters.join(' ')} ${d.group} ${st.notes?.[d.n] || ''}`,
    }))
  })
  getStore('col:quant', []).forEach((q) => docs.push({
    scope: 'quant', section: 'Quant', to: '/ml-quant', title: q.prompt || 'Question',
    sub: [q.topic, q.difficulty].filter(Boolean).join(' · '), text: `${q.prompt} ${q.topic} ${q.difficulty} ${q.notes || ''}`,
  }))
  getStore('col:dsa', []).forEach((p) => {
    const topics = Array.isArray(p.topics) ? p.topics.join(' ') : (p.topic || '')
    docs.push({
      scope: 'dsa', section: 'DSA', to: '/dsa', title: p.title,
      sub: [p.difficulty, topics.trim() || null, p.status === 'todo' ? 'To-do' : (p.score ? `scored ${p.score}/5` : null)].filter(Boolean).join(' · '),
      text: `${p.title} ${p.difficulty} ${topics} ${p.notes || ''} ${p.status || ''}`,
    })
  })
  getStore('col:contests', []).forEach((c) => docs.push({
    scope: 'contest', section: 'Contest', to: '/dsa', title: c.name || 'Contest',
    sub: [c.platform, c.date].filter(Boolean).join(' · '), text: `${c.name} ${c.platform} contest ${c.date || ''}`,
  }))
  getStore('cs:topics', []).forEach((r) => docs.push({
    scope: 'cs', section: `CS · ${r.subject || 'Core'}`, to: '/cs-core',
    title: r.chapter || 'Topics', sub: r.subject || 'CS Core', text: `${r.subject} ${r.chapter} ${r.topics}`,
  }))
  ODIN_ITEMS.forEach((it) => docs.push({
    scope: 'odin', section: `Full Stack · ${it.course}`, to: '/full-stack',
    title: it.title, sub: `${it.section} · ${it.type}`, text: `${it.title} ${it.course} ${it.section} ${it.type}`,
  }))
  return docs
}

function score(text, q) {
  text = text.toLowerCase(); q = q.trim().toLowerCase()
  if (!q) return 0
  if (text.includes(q)) return 100 - Math.min(50, text.indexOf(q) / 5)
  const toks = q.split(/\s+/)
  if (toks.length > 1 && toks.every((t) => text.includes(t))) return 60
  let i = 0
  for (const ch of text) { if (ch === q[i]) i++; if (i === q.length) return 30 }
  return 0
}

export default function Search() {
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('all')
  const docs = useMemo(buildDocs, [])
  const results = useMemo(() => {
    if (!q.trim()) return []
    return docs
      .filter((d) => scope === 'all' || d.scope === scope)
      .map((d) => ({ d, s: score(d.text, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 60)
      .map((x) => x.d)
  }, [q, scope, docs])
  const groups = useMemo(() => {
    const m = {}, order = []
    results.forEach((r) => { if (!m[r.section]) { m[r.section] = []; order.push(r.section) } m[r.section].push(r) })
    return order.map((s) => ({ section: s, items: m[s] }))
  }, [results])

  return (
    <div className="page">
      <div className="pagehead reveal">
        <Link to="/" className="back" aria-label="Back to home"><IconBack /></Link>
        <div className="htx"><div className="eye">Find anything</div><h1>Search</h1></div>
      </div>

      <div className="searchbar reveal">
        <span className="si"><IconSearch /></span>
        <input autoFocus className="sinput" placeholder="Search days, chapters, CS topics, questions, notes…"
          value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQ('')} />
        {q ? <button className="sclear" onClick={() => setQ('')} aria-label="Clear search">×</button> : null}
      </div>

      <div className="sfilters reveal">
        {SCOPES.map((s) => (
          <button key={s.k} className={'schip ' + (scope === s.k ? 'on' : '')} onClick={() => setScope(s.k)}>{s.label}</button>
        ))}
      </div>

      <section className="card reveal">
        {!q.trim() ? (
          <div className="sempty">
            <div className="sempty-t">Search across everything</div>
            <div className="sempty-b">Reading days, CS Core topics, quant questions, DSA problems, contests, and your notes.</div>
            <div className="sexamples">
              <span className="lbl">Try</span>
              {EXAMPLES.map((e) => <button key={e} className="sex" onClick={() => setQ(e)}>{e}</button>)}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="sempty">
            <div className="sempty-t">No matches for “{q}”</div>
            <div className="sempty-b">Try a chapter name, a topic, or part of a note — or widen the filter to All.</div>
          </div>
        ) : (
          <>
            <div className="scount">{results.length} result{results.length === 1 ? '' : 's'}</div>
            {groups.map((g) => (
              <div className="sgroup" key={g.section}>
                <div className="sgrouphead">{g.section} · {g.items.length}</div>
                <div className="sresults">
                  {g.items.map((r, i) => (
                    <Link className="sresult" to={r.to} key={i}>
                      <span className="sbody"><span className="stitle">{r.title}</span><span className="ssub">{r.sub}</span></span>
                      <span className="sgo">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  )
}
