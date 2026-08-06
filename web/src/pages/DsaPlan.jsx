import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IconBack } from '../components/icons.jsx'
import { EmptyState } from '../components/ui.jsx'
import { useCloud } from '../lib/clouddb.js'

const diffTone = (d) => (d === 'Hard' ? 'hard' : d === 'Easy' ? 'easy' : 'med')
const diffRank = { Easy: 0, Medium: 1, Hard: 2 }
const diffShort = { Easy: 'Easy', Medium: 'Medium', Hard: 'Hard' }
const DIFFS = ['Easy', 'Medium', 'Hard']
const today = () => new Date().toISOString().slice(0, 10)
const asDay = (iso) => new Date(iso + 'T00:00:00')
const dNum = (iso) => asDay(iso).getDate()
const dWk = (iso) => asDay(iso).toLocaleDateString('en-US', { weekday: 'short' })
const dMon = (iso) => asDay(iso).toLocaleDateString('en-US', { month: 'short' })
const fmtFull = (iso) => asDay(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

const dsaToRow = (x) => ({
  id: x.id, slug: x.slug || null, title: x.title || null, url: x.url || null,
  difficulty: x.difficulty || null, topics: Array.isArray(x.topics) ? x.topics : [],
  notes: x.notes || '', status: x.status || 'todo', score: x.score == null ? null : x.score,
  target_date: x.target_date || null, source: x.source || 'manual', plan: x.plan || 'My problems',
  created_at: x.created_at || new Date().toISOString(), updated_at: x.updated_at || new Date().toISOString(),
  solved_at: x.solved_at || null,
})
const dsaFromRow = (r) => ({ ...r, topics: Array.isArray(r.topics) ? r.topics : [] })
const TrashIcon = () => <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" /></svg>

// Lead a day with its "watch this first" and theory items, then problems by difficulty.
// Normal problems keep their existing difficulty order (rank === diffRank), so plans
// without Video/Theory tags are unaffected.
const leadRank = (x) => {
  const t = x.topics || []
  if (t.includes('Video')) return -3
  if (t.includes('Revision') || t.includes('Consolidation')) return -2
  if (x.difficulty == null) return -1 // theory / reading
  return diffRank[x.difficulty] ?? 1
}
const sortDay = (arr) => [...arr].sort((a, b) => {
  if ((a.status === 'solved') !== (b.status === 'solved')) return a.status === 'solved' ? 1 : -1
  return (leadRank(a) - leadRank(b)) || String(a.title).localeCompare(String(b.title))
})

function Check({ done, onClick, label }) {
  return (
    <button className={done ? 'rcheck on' : 'rcheck'} onClick={onClick} aria-pressed={done} aria-label={label}>
      {done && <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  )
}

function QRow({ x, i, onToggle, onRemove }) {
  const done = x.status === 'solved'
  return (
    <motion.div className={'dsa-qrow' + (done ? ' solved' : '')} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.24) }}>
      <Check done={done} onClick={() => onToggle(x)} label={done ? `Mark ${x.title} to-do` : `Mark ${x.title} solved`} />
      <div className="dsa-qmain">
        {x.url ? <a className="dsa-qtitle" href={x.url} target="_blank" rel="noreferrer">{x.title} <span className="dsa-ext" aria-hidden="true">↗</span></a> : <span className="dsa-qtitle">{x.title}</span>}
        {(x.topics || []).length ? <span className="dsa-qtopics">{(x.topics || []).slice(0, 4).join(' · ')}</span> : null}
      </div>
      {x.difficulty ? <span className={'dsa-diffbadge ' + diffTone(x.difficulty)}>{diffShort[x.difficulty] || x.difficulty}</span> : <span className="dsa-diffbadge none">—</span>}
      <button className="dsa-iconbtn danger" onClick={() => onRemove(x.id)} aria-label={`Delete ${x.title}`} title="Remove"><TrashIcon /></button>
    </motion.div>
  )
}

export default function DsaPlan() {
  const { name } = useParams()
  const plan = decodeURIComponent(name || 'My problems')
  const problems = useCloud('dsa_problems', { localKey: 'col:dsa', toRow: dsaToRow, fromRow: dsaFromRow })

  const items = useMemo(() => problems.items.filter((x) => (x.plan || 'My problems') === plan), [problems.items, plan])
  const total = items.length
  const solved = useMemo(() => items.filter((x) => x.status === 'solved').length, [items])
  const due = useMemo(() => items.filter((x) => x.status !== 'solved' && x.target_date && x.target_date < today()).length, [items])
  const pct = total ? Math.round((solved / total) * 100) : 0

  const breakdown = useMemo(() => {
    const b = { Easy: { s: 0, t: 0 }, Medium: { s: 0, t: 0 }, Hard: { s: 0, t: 0 } }
    items.forEach((x) => { if (b[x.difficulty]) { b[x.difficulty].t++; if (x.status === 'solved') b[x.difficulty].s++ } })
    return b
  }, [items])

  // group by due date (day) — undated problems collect under "Unscheduled"
  const groups = useMemo(() => {
    const byDay = new Map()
    const undated = []
    items.forEach((x) => {
      if (x.target_date) {
        const d = x.target_date.slice(0, 10)
        if (!byDay.has(d)) byDay.set(d, [])
        byDay.get(d).push(x)
      } else undated.push(x)
    })
    const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, arr]) => ({ key: date, date, items: sortDay(arr) }))
    if (undated.length) days.push({ key: 'unscheduled', date: null, items: sortDay(undated) })
    return days
  }, [items])

  const PAGE_SIZE = 6
  const [selKey, setSelKey] = useState(null)
  const [page, setPage] = useState(0)

  // index of the day-group closest to today (dated groups only) — the default focus
  const closestIdx = useMemo(() => {
    if (!groups.length) return 0
    const t = new Date(today() + 'T00:00:00').getTime()
    let best = -1, bestDiff = Infinity
    groups.forEach((g, i) => {
      if (!g.date) return
      const diff = Math.abs(new Date(g.date + 'T00:00:00').getTime() - t)
      if (diff < bestDiff) { bestDiff = diff; best = i }
    })
    return best < 0 ? 0 : best
  }, [groups])

  const pageCount = Math.max(1, Math.ceil(groups.length / PAGE_SIZE))
  const curPage = Math.min(page, pageCount - 1)
  const pageGroups = groups.slice(curPage * PAGE_SIZE, curPage * PAGE_SIZE + PAGE_SIZE)

  // default the selection + visible page to today / the closest day when the plan opens
  useEffect(() => {
    if (!groups.length) { if (selKey !== null) setSelKey(null); return }
    if (!groups.some((g) => g.key === selKey)) setSelKey(groups[closestIdx].key)
  }, [groups, selKey, closestIdx])
  useEffect(() => { setPage(Math.floor(closestIdx / PAGE_SIZE)) }, [closestIdx])

  const sel = groups.find((g) => g.key === selKey) || groups[0] || null
  const selSolved = sel ? sel.items.filter((x) => x.status === 'solved').length : 0
  const selOverdue = sel && sel.date && sel.date < today() && sel.items.some((x) => x.status !== 'solved')

  const toggle = (x) => {
    const now = new Date().toISOString()
    if (x.status === 'solved') problems.update(x.id, { status: 'todo', solved_at: null, updated_at: now })
    else problems.update(x.id, { status: 'solved', solved_at: now, score: x.score || 4, updated_at: now })
  }

  // check-all for a day: solve every problem in the group, or un-solve if all are already done
  const toggleDay = (g) => {
    const now = new Date().toISOString()
    const allDone = g.items.length > 0 && g.items.every((x) => x.status === 'solved')
    const rows = []
    g.items.forEach((x) => {
      if (allDone && x.status === 'solved') rows.push({ ...x, status: 'todo', solved_at: null, updated_at: now })
      else if (!allDone && x.status !== 'solved') rows.push({ ...x, status: 'solved', solved_at: now, score: x.score || 4, updated_at: now })
    })
    if (rows.length) problems.upsertMany(rows)
  }

  return (
    <div className="cs-wrap dsa-plan-page">
      <div className="pagehead reveal">
        <Link to="/dsa" className="back" aria-label="Back to DSA"><IconBack /></Link>
        <div className="htx">
          <div className="eye">Plan · checklist</div>
          <h1>{plan}</h1>
        </div>
      </div>

      {total === 0 ? (
        <section className="cs-box reveal">
          <EmptyState title="No problems in this plan">
            Add problems or import a CSV from the <Link to="/dsa" className="dsa-plan-go">DSA page</Link> to start tracking here.
          </EmptyState>
        </section>
      ) : (
        <div className="dsa-plan3 reveal">
          {/* LEFT — information */}
          <aside className="dsa-info cs-box">
            <div className="dsa-col-eye">Total progress</div>
            <div className="dsa-info-big">{solved}<span> / {total}</span></div>
            <div className="dsa-progress"><motion.i initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ type: 'spring', stiffness: 120, damping: 22 }} /></div>
            <div className="dsa-info-pct">{pct}% complete</div>

            <div className="dsa-info-break">
              {DIFFS.filter((d) => breakdown[d].t > 0).map((d) => {
                const { s, t } = breakdown[d]
                return (
                  <div className="dsa-info-brow" key={d}>
                    <span className={'dsa-diffdot ' + diffTone(d)} aria-hidden="true" />
                    <span className="dsa-info-dl">{diffShort[d]}</span>
                    <div className="dsa-progress sm"><i style={{ width: (t ? (s / t) * 100 : 0) + '%' }} /></div>
                    <span className="dsa-diffn">{s}/{t}</span>
                  </div>
                )
              })}
            </div>

            <div className="dsa-info-stats">
              <div><b>{total - solved}</b><span>To-do</span></div>
              <div><b>{due}</b><span>Overdue</span></div>
              <div><b>{groups.length}</b><span>{groups.length === 1 ? 'Day' : 'Days'}</span></div>
            </div>
          </aside>

          {/* CENTER — dates */}
          <div className="dsa-days cs-box">
            <div className="dsa-days-top">
              <div className="dsa-col-eye">Schedule · {groups.length}</div>
              {pageCount > 1 ? (
                <div className="dsa-pager">
                  <button className="dsa-pg" onClick={() => setPage(curPage - 1)} disabled={curPage === 0} aria-label="Previous days">‹</button>
                  <span className="dsa-pg-n">{curPage + 1} / {pageCount}</span>
                  <button className="dsa-pg" onClick={() => setPage(curPage + 1)} disabled={curPage === pageCount - 1} aria-label="Next days">›</button>
                </div>
              ) : null}
            </div>
            <div className="dsa-days-list">
              {pageGroups.map((g) => {
                const gs = g.items.filter((x) => x.status === 'solved').length
                const active = sel && g.key === sel.key
                const overdue = g.date && g.date < today() && gs < g.items.length
                const done = gs === g.items.length
                const label = g.date ? fmtFull(g.date) : 'Unscheduled'
                return (
                  <div key={g.key} className={'dsa-day' + (active ? ' on' : '') + (done ? ' done' : '')}>
                    <button className={'rcheck dsa-day-check' + (done ? ' on' : '')} onClick={() => toggleDay(g)} aria-pressed={done} aria-label={done ? `Mark all in ${label} to-do` : `Mark all ${g.items.length} in ${label} solved`} title={done ? 'Mark all to-do' : 'Mark all solved'}>
                      {done && <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                    <button className="dsa-day-open" onClick={() => setSelKey(g.key)} aria-pressed={active} aria-label={`Show ${label}`}>
                      <span className={'dsa-day-date' + (g.date ? '' : ' un')}>
                        <b>{g.date ? dNum(g.date) : '∞'}</b>
                        <i>{g.date ? dWk(g.date) : 'Any'}</i>
                      </span>
                      <span className="dsa-day-meta">
                        <span className="dsa-day-label">{g.date ? dMon(g.date) : 'Unscheduled'}{overdue ? <em className="dsa-day-flag">overdue</em> : null}</span>
                        <span className="dsa-day-bar"><i style={{ width: (g.items.length ? (gs / g.items.length) * 100 : 0) + '%' }} /></span>
                      </span>
                      <span className="dsa-day-count">{gs}/{g.items.length}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT — questions for the selected day */}
          <div className="dsa-ques cs-box">
            {sel ? (
              <>
                <div className="dsa-ques-head">
                  <h2>{sel.date ? fmtFull(sel.date) : 'Unscheduled'}{selOverdue ? <span className="dsa-ques-flag">overdue</span> : null}</h2>
                  <span className="dsa-ques-count">{selSolved} / {sel.items.length} solved</span>
                </div>
                <div className="dsa-ques-list">
                  {sel.items.map((x, i) => <QRow key={x.id} x={x} i={i} onToggle={toggle} onRemove={problems.remove} />)}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
