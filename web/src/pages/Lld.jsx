import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBack } from '../components/icons.jsx'
import { SmallRing } from '../components/ui.jsx'
import { useStore } from '../lib/store.js'
import { scheduleInfo, fmtDate, fmtDateFull } from '../lib/schedule.js'
import {
  LLD_DAYS, LLD_TOTAL_DAYS, TYPE_LABEL,
  dayComplete, currentDayIndex, lldPct, phaseStats, doneDaysCount, writeLldStats,
} from '../lib/lld.js'

const PAGE = 12
const PHASE_SHORT = { 'OOP Foundations': 'OOP', 'Design Principles': 'PRIN', 'UML & Patterns': 'PAT', 'Interview Tips': 'TIPS', Questions: 'Q' }

function Check({ done, onClick, label }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={done}
      className={'grid h-[22px] w-[22px] flex-none place-items-center rounded-full border transition-colors ' + (done ? 'border-[#e6e6e6] bg-[#e6e6e6]' : 'border-[#474747] hover:border-white/60')}>
      {done && <svg width="12" height="12" viewBox="0 0 24 24"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  )
}

export default function Lld() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setReady(true); return }
    const t = setTimeout(() => setReady(true), 500); return () => clearTimeout(t)
  }, [])
  const [done, setDone] = useStore('lld:done', {})
  const [notes, setNotes] = useStore('lld:notes', {})
  const setNote = (n, text) => setNotes((s) => ({ ...s, [n]: text }))
  const [selDay, setSelDay] = useState(null)
  const [page, setPage] = useState(0)
  const swipeX = useRef(0)

  const days = LLD_DAYS
  const total = LLD_TOTAL_DAYS
  const toggle = (key) => setDone((s) => { const n = { ...s }; if (n[key]) delete n[key]; else n[key] = new Date().toISOString(); return n })
  const markDay = (day, complete) => setDone((s) => { const n = { ...s }; day.items.forEach((it) => { if (complete) n[it.key] = new Date().toISOString(); else delete n[it.key] }); return n })

  const curIdx = useMemo(() => currentDayIndex(done), [done])
  const cal = useMemo(() => scheduleInfo('lld', total), [total])
  const focusDay = Math.min(cal.todayN || curIdx, total)
  const isToday = (n) => cal.todaySet.has(n)
  const active = selDay && selDay <= total ? selDay : focusDay
  useEffect(() => { setPage(Math.floor((active - 1) / PAGE)) }, [active])
  const goDay = (delta) => setSelDay((prev) => { const cur = prev && prev <= total ? prev : focusDay; return Math.min(total, Math.max(1, cur + delta)) })
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement
      if (el && (/^(input|textarea|select)$/i.test(el.tagName) || el.isContentEditable)) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); goDay(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goDay(1) }
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [total]) // eslint-disable-line

  const { doneItems, pct } = lldPct(done)
  const phases = phaseStats(done)
  const doneDays = doneDaysCount(done)
  const allComplete = doneDays >= total
  const behind = Math.max(0, cal.due - doneDays)
  const ahead = Math.max(0, doneDays - cal.due)
  const paceText = allComplete ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track'
  const paceCls = allComplete ? 'ok' : behind ? 'late' : ahead ? 'ok' : 'ontrack'
  const remaining = total - doneDays
  const estFinish = cal.finishISO ? new Date(cal.finishISO + 'T00:00') : new Date()

  useEffect(() => { writeLldStats(done) }, [done])

  const activeDay = days[active - 1]
  const dayDone = dayComplete(activeDay, done)
  const pageCount = Math.ceil(total / PAGE)
  const pg = Math.min(page, pageCount - 1)
  const slice = days.slice(pg * PAGE, pg * PAGE + PAGE)

  return (
    <div className="cs-wrap">
      <div className="pagehead reveal">
        <Link to="/" className="back" aria-label="Back to home"><IconBack /></Link>
        <div className="htx"><div className="eye">Curriculum · awesome-low-level-design</div><h1>Low Level Design</h1></div>
      </div>

      {!ready ? null : (
        <div className="cs-grid3 rk-grid">
          <aside className="cs-col cs-col-left reveal">
            <div className="cs-box rk-stats">
              <div className="cs-panel-eye">LLD interview prep · Oct 1 – Nov 15</div>
              <div className="rk-stat-body">
                <SmallRing pct={pct} size={92} stroke={9} />
                <div className="rk-stat-info">
                  <div className="cs-head-day">{fmtDate(cal.dates[focusDay - 1])} <span>/ {total} days</span></div>
                  <div className="cs-head-sub">{doneDays} of {total} days · {doneItems} items done</div>
                  <span className={`rpace ${paceCls}`}>{paceText}</span>
                </div>
              </div>
              <div className="rk-vols">
                {phases.map((p) => (
                  <div className="rk-vol" key={p.phase}>
                    <span className="rk-vol-n">{p.phase}</span>
                    <span className="rk-vol-bar"><i style={{ width: p.pct + '%' }} /></span>
                    <span className="rk-vol-p">{p.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="rk-finish">{allComplete ? 'Plan complete — you’re interview-ready.' : <>Ends <b>{estFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</b> · {remaining} day{remaining === 1 ? '' : 's'} left</>}</div>
            </div>

            <div className="cs-box">
              <div className="cs-panel-eye">The method · every problem</div>
              <ol className="lld-method">
                <li>Clarify requirements &amp; scope cuts</li>
                <li>Core entities → classes (SRP)</li>
                <li>Map relationships (has-a vs owns-a)</li>
                <li>Apply 1–3 patterns, justified</li>
                <li>Define public APIs</li>
                <li>Concurrency &amp; edge cases</li>
                <li>Code a clean skeleton</li>
              </ol>
            </div>
          </aside>

          <main className="cs-col cs-col-center reveal">
            <div className="cs-detail cg-detail"
              onTouchStart={(e) => { swipeX.current = e.touches[0].clientX }}
              onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - swipeX.current; if (Math.abs(dx) > 55) goDay(dx < 0 ? 1 : -1) }}>
              <span className="cg-glow" aria-hidden="true" />
              <div className="cs-detail-head">
                <button className="cs-nav-arrow" onClick={() => goDay(-1)} disabled={active <= 1} aria-label="Previous day">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                </button>
                <span className="cs-detail-eye">{isToday(active) ? 'Today · ' : ''}{fmtDateFull(cal.dates[active - 1])}</span>
                <button className="cs-nav-arrow" onClick={() => goDay(1)} disabled={active >= total} aria-label="Next day">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
              <div className="rk-detail">
                <div className="rk-detail-top">
                  <span className="uchip">{activeDay.phase}</span>
                  {activeDay.tag ? <span className="lld-tag">{activeDay.tag}</span> : null}
                  {isToday(active) ? <span className="rk-today-badge">Today</span> : null}
                  {dayDone ? <span className="rk-done-badge">Done</span> : null}
                </div>
                <div className="rk-pages">{activeDay.title}</div>
                <div className="rk-chapters">{activeDay.focus}</div>
                <label className="rk-notes-label">Today’s items</label>
                <div className="odin-items">
                  {activeDay.items.map((it) => (
                    <div className={done[it.key] ? 'odin-item done' : 'odin-item'} key={it.key}>
                      <Check done={!!done[it.key]} onClick={() => toggle(it.key)} label={`Toggle ${it.title}`} />
                      <div className="odin-item-body">
                        <div className="odin-item-t">{it.title}<span className="odin-tag">{TYPE_LABEL[it.type] || it.type}</span></div>
                        {it.hours ? <div className="odin-item-m">~{it.hours}h</div> : null}
                      </div>
                      {it.url ? <a className="odin-open" href={it.url} target="_blank" rel="noreferrer" aria-label={`Open ${it.title}`} onClick={(e) => e.stopPropagation()}>Open ↗</a> : null}
                    </div>
                  ))}
                </div>
                <label className="rk-notes-label" htmlFor={`lld-note-${active}`} style={{ display: 'block', marginTop: 16 }}>Notes</label>
                <textarea id={`lld-note-${active}`} className="rnote lld-note" placeholder="Key ideas, class sketches, patterns to remember, links to your solutions…" value={notes[active] || ''} onChange={(e) => setNote(active, e.target.value)} />
                <button className={dayDone ? 'rbtn done' : 'rbtn'} onClick={() => markDay(activeDay, !dayDone)}>{dayDone ? 'Completed ✓' : 'Mark day complete'}</button>
              </div>
            </div>
          </main>

          <aside className="cs-col cs-col-right reveal">
            <div className="cs-window">
              <div className="cs-window-h">Full plan · {total} days</div>
              <div className="cs-window-scroll">
                <div className="cs-cellgrid">
                  {slice.map((d, i) => {
                    const n = pg * PAGE + i + 1
                    const isDone = dayComplete(d, done)
                    const cls = 'cs-cell' + (isDone ? ' complete' : '') + (isToday(n) ? ' cs-today' : '') + (n === active ? ' sel' : '')
                    return (
                      <button key={n} className={cls} style={{ animationDelay: `${Math.min(i * 8, 200)}ms` }} onClick={() => setSelDay(n)} aria-label={`${fmtDate(cal.dates[n - 1])}${isToday(n) ? ', today' : ''}`}>
                        {isDone ? <span className="cs-cell-check"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span> : <SmallRing pct={n === active ? 100 : 0} size={26} stroke={3} showValue={false} />}
                        <span className="cs-cell-n">{fmtDate(cal.dates[n - 1])}{notes[n] ? <i className="rk-note-dot" /> : null}</span>
                        <span className="cs-cell-m">{PHASE_SHORT[d.phase]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="cs-pager">
                <button className="cs-pager-btn" onClick={() => setPage(Math.max(0, pg - 1))} disabled={pg === 0} aria-label="Previous page">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                </button>
                <span className="cs-pager-n">Page {pg + 1} of {pageCount}</span>
                <button className="cs-pager-btn" onClick={() => setPage(Math.min(pageCount - 1, pg + 1))} disabled={pg >= pageCount - 1} aria-label="Next page">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
