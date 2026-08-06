import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBack } from '../components/icons.jsx'
import ReadingTracker from '../components/ReadingTracker.jsx'
import { Segmented, Chip, Dropdown, Donut } from '../components/ui.jsx'
import Modal from '../components/Modal.jsx'
import CalendarCard from '../components/CalendarCard.jsx'
import { useCollection } from '../lib/progress.js'

const dayKey = (x) => {
  const d = new Date(x.created || Date.now())
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const prettyDate = (iso) => new Date(iso + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const DIFF_COLOR = { Easy: '#00b8a3', Medium: '#ffc01e', Hard: '#ff375f' }
const DIFF_OPTS = [{ v: 'Easy', l: 'Easy' }, { v: 'Medium', l: 'Medium' }, { v: 'Hard', l: 'Hard' }]
const Q_PAGE = 5

const DIFFS = ['Easy', 'Medium', 'Hard']
const toneOf = (d) => (d === 'Hard' ? 'hard' : d === 'Easy' ? 'easy' : 'med')

function Stepper({ value, onDec, onInc, label }) {
  return (
    <div className="q-att" role="group" aria-label={label}>
      <span className="q-att-l">Attempts</span>
      <button className="q-att-b" onClick={onDec} aria-label="Decrease attempts">−</button>
      <b className="q-att-v tabular-nums">{value || 0}</b>
      <button className="q-att-b" onClick={onInc} aria-label="Increase attempts">+</button>
    </div>
  )
}

function QuantBank() {
  const { items, add, update, remove } = useCollection('quant')
  const [form, setForm] = useState({ prompt: '', link: '', topic: '', difficulty: 'Medium' })
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [openNote, setOpenNote] = useState(null)
  const [openDay, setOpenDay] = useState(null)
  const [openQ, setOpenQ] = useState(null)
  const [bankPage, setBankPage] = useState(0)

  const solved = items.filter((x) => x.solved).length
  const byDiff = { Easy: 0, Medium: 0, Hard: 0 }
  const solvedByDiff = { Easy: 0, Medium: 0, Hard: 0 }
  items.forEach((x) => { if (byDiff[x.difficulty] != null) { byDiff[x.difficulty]++; if (x.solved) solvedByDiff[x.difficulty]++ } })
  const dayset = useMemo(() => new Set(items.map(dayKey)), [items])
  const dayItems = useMemo(() => (openDay ? items.filter((x) => dayKey(x) === openDay) : []), [items, openDay])
  const detail = openQ ? items.find((x) => x.id === openQ) : null

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return items.filter((x) => {
      if (filter === 'solved' && !x.solved) return false
      if (filter === 'unsolved' && x.solved) return false
      if (DIFFS.includes(filter) && x.difficulty !== filter) return false
      if (t && !`${x.prompt} ${x.topic} ${x.difficulty}`.toLowerCase().includes(t)) return false
      return true
    })
  }, [items, filter, q])
  const pageCount = Math.max(1, Math.ceil(filtered.length / Q_PAGE))
  const curPage = Math.min(bankPage, pageCount - 1)
  const pageItems = filtered.slice(curPage * Q_PAGE, curPage * Q_PAGE + Q_PAGE)
  useEffect(() => { setBankPage(0) }, [filter, q])

  const submit = (e) => {
    e.preventDefault()
    if (!form.prompt.trim()) return
    add({ ...form, attempts: 0, solved: false, notes: '' })
    setForm({ prompt: '', link: '', topic: '', difficulty: 'Medium' })
    setAddOpen(false)
  }

  const FILTERS = [
    { k: 'all', label: 'All' }, { k: 'unsolved', label: 'To do' }, { k: 'solved', label: 'Solved' },
    { k: 'Easy', label: 'Easy' }, { k: 'Medium', label: 'Medium' }, { k: 'Hard', label: 'Hard' },
  ]

  return (
    <>
    <div className="cs-grid3 rk-grid">
      <aside className="cs-col cs-col-left reveal">
        <div className="cs-box q-progress">
          <div className="cs-panel-eye">Progress</div>
          <div className="q-progress-body">
            <Donut centerValue={solved} centerLabel="solved" segments={DIFFS.map((d) => ({ label: d, value: solvedByDiff[d], color: DIFF_COLOR[d] }))} />
            <div className="q-progress-legend">
              {DIFFS.map((d) => (
                <div className="q-leg" key={d}>
                  <span className="q-leg-dot" style={{ background: DIFF_COLOR[d] }} />
                  <span className="q-leg-l">{d}</span>
                  <span className="q-leg-v">{solvedByDiff[d]}<i> / {byDiff[d]}</i></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cs-box q-addbox">
          <button className="q-add-head" onClick={() => setAddOpen((o) => !o)} aria-expanded={addOpen}>
            <span className="cs-panel-eye">Add a question</span>
            <span className={addOpen ? 'cs-chev open' : 'cs-chev'}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </button>
          {addOpen && (
            <form className="qform" onSubmit={submit}>
              <textarea className="rnote" placeholder="Question prompt…" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
              <div className="qrow">
                <input className="finput" placeholder="Topic (e.g. probability)" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
                <Dropdown value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={DIFF_OPTS} ariaLabel="Difficulty" />
              </div>
              <input className="finput" placeholder="Source link (optional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              <button className="rbtn" type="submit">Add question</button>
            </form>
          )}
        </div>
      </aside>

      <main className="cs-col cs-col-center reveal">
        <CalendarCard markedDates={dayset} onPick={(iso) => { setOpenDay(iso); setOpenQ(null) }} title="Question calendar" subtitle="Grey days have questions — tap a day to review them." />
      </main>

      <aside className="cs-col cs-col-right reveal">
        <div className="cs-box q-searchbox">
          <div className="searchbar cs-search">
            <span className="si"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg></span>
            <input className="sinput" placeholder="Search questions…" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="sclear" onClick={() => setQ('')} aria-label="Clear">×</button>}
          </div>
          <div className="q-filters">
            {FILTERS.map((f) => (
              <button key={f.k} className={'q-chip' + (filter === f.k ? ' on' : '')} onClick={() => setFilter(f.k)}>{f.label}</button>
            ))}
          </div>
        </div>

        <div className="cs-window q-bankwin">
          <div className="cs-window-h">Question bank · {solved}/{items.length} solved</div>
          <div className="cs-window-scroll q-scroll">
            {items.length === 0 ? (
              <div className="q-empty"><div className="q-empty-t">No questions yet</div><div className="q-empty-b">Add questions to build your bank — browse them by date on the calendar.</div></div>
            ) : filtered.length === 0 ? (
              <div className="q-empty"><div className="q-empty-t">No matches</div><div className="q-empty-b">Try a different filter or clear the search.</div></div>
            ) : (
              <div className="q-list">
                {pageItems.map((x) => (
                  <div className={'q-row' + (x.solved ? ' solved' : '')} key={x.id}>
                    <div className="q-row-top">
                      <p className="q-row-prompt">{x.prompt}</p>
                      <button className="q-del" onClick={() => remove(x.id)} aria-label="Delete question">×</button>
                    </div>
                    <div className="q-row-meta">
                      {x.topic ? <Chip>{x.topic}</Chip> : null}
                      <Chip tone={toneOf(x.difficulty)}>{x.difficulty}</Chip>
                      {x.link ? <a className="q-open" href={x.link} target="_blank" rel="noreferrer">Open ↗</a> : null}
                    </div>
                    <div className="q-row-actions">
                      <Stepper value={x.attempts} onDec={() => update(x.id, { attempts: Math.max(0, (x.attempts || 0) - 1) })} onInc={() => update(x.id, { attempts: (x.attempts || 0) + 1 })} label="Attempts" />
                      <button className={x.solved ? 'q-solve on' : 'q-solve'} onClick={() => update(x.id, { solved: !x.solved })}>{x.solved ? 'Solved ✓' : 'Mark solved'}</button>
                      <button className="q-note-t" onClick={() => setOpenNote(openNote === x.id ? null : x.id)}>Notes</button>
                    </div>
                    {openNote === x.id && (
                      <textarea className="rnote sm" placeholder="Working / insight…" value={x.notes || ''} onChange={(e) => update(x.id, { notes: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {pageCount > 1 && (
            <div className="cs-pager">
              <button className="cs-pager-btn" onClick={() => setBankPage(curPage - 1)} disabled={curPage === 0} aria-label="Previous page">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <span className="cs-pager-n">Page {curPage + 1} of {pageCount}</span>
              <button className="cs-pager-btn" onClick={() => setBankPage(curPage + 1)} disabled={curPage >= pageCount - 1} aria-label="Next page">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>

    <Modal open={!!openDay} onClose={() => { setOpenDay(null); setOpenQ(null) }} title={openDay ? prettyDate(openDay) : ''}>
      {dayItems.length ? (
        <div className="q-pop-list">
          {dayItems.map((x) => (
            <button key={x.id} className={'q-pop-row' + (x.solved ? ' solved' : '')} onClick={() => setOpenQ(x.id)}>
              <span className="q-pop-prompt">{x.prompt}</span>
              <span className="q-pop-meta">
                {x.topic ? <Chip>{x.topic}</Chip> : null}
                <Chip tone={toneOf(x.difficulty)}>{x.difficulty}</Chip>
                {x.solved ? <span className="q-pop-solved">Solved ✓</span> : null}
              </span>
            </button>
          ))}
        </div>
      ) : <div className="q-pop-empty">No questions entered on this day.</div>}
    </Modal>

    <Modal open={!!detail} onClose={() => setOpenQ(null)} title="Question" maxWidth={540}>
      {detail ? (
        <div className="q-detail">
          <div className="q-detail-meta">
            <Chip tone={toneOf(detail.difficulty)}>{detail.difficulty}</Chip>
            {detail.topic ? <Chip>{detail.topic}</Chip> : null}
            {detail.link ? <a className="q-open" href={detail.link} target="_blank" rel="noreferrer">Open ↗</a> : null}
          </div>
          <p className="q-detail-prompt">{detail.prompt}</p>
          <div className="q-detail-actions">
            <Stepper value={detail.attempts} onDec={() => update(detail.id, { attempts: Math.max(0, (detail.attempts || 0) - 1) })} onInc={() => update(detail.id, { attempts: (detail.attempts || 0) + 1 })} label="Attempts" />
            <button className={detail.solved ? 'rbtn done' : 'rbtn'} onClick={() => update(detail.id, { solved: !detail.solved })}>{detail.solved ? 'Solved ✓' : 'Mark solved'}</button>
          </div>
          <label className="q-notes-label">Your notes</label>
          <textarea className="rnote q-detail-note" placeholder="Your working / insight…" value={detail.notes || ''} onChange={(e) => update(detail.id, { notes: e.target.value })} />
        </div>
      ) : null}
    </Modal>
    </>
  )
}

export default function MlQuant() {
  const [tab, setTab] = useState('handson')
  return (
    <div className="rk-page">
      <div className="pagehead reveal">
        <Link to="/" className="back" aria-label="Back to home"><IconBack /></Link>
        <div className="htx"><div className="eye">Reading + daily quant</div><h1>ML · Quant</h1></div>
      </div>
      <div className="reveal rk-narrow mlq-tabs">
        <Segmented value={tab} onChange={setTab} options={[
          { value: 'handson', label: 'HOML' },
          { value: 'math', label: 'MML' },
          { value: 'quant', label: 'Quant' },
        ]} />
      </div>
      {tab === 'handson' && <ReadingTracker planId="handson" chapterFocus />}
      {tab === 'math' && <ReadingTracker planId="math" chapterFocus />}
      {tab === 'quant' && <QuantBank />}
    </div>
  )
}
