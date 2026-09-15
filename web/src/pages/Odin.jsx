import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBack, TechLogo, TECH_LABEL } from '../components/icons.jsx'
import { SmallRing, Segmented } from '../components/ui.jsx'
import { useStore } from '../lib/store.js'
import { scheduleInfo } from '../lib/schedule.js'
import {
  ODIN_ITEMS, ODIN_COURSE_ORDER, ODIN_TOTAL_HOURS, ODIN_PACE,
  packOdinDays, odinPlanProgress, dayHours, fmtHours, courseStats, currentDayIndex, odinPct, techForDay, ODIN_DEFAULT_PACING,
} from '../lib/odin.js'

const PAGE = 12
const SHORT = { Foundations: 'FND', 'Intermediate HTML and CSS': 'HTML', JavaScript: 'JS', 'Advanced HTML and CSS': 'ADV', React: 'RCT', Databases: 'DB', NodeJS: 'NODE', 'Getting Hired': 'HIRE' }

function Check({ done, onClick, label }) {
  return (
    <button className={done ? 'rcheck on' : 'rcheck'} onClick={onClick} aria-pressed={done} aria-label={label}>
      {done && <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  )
}

function OdinSkeleton() {
  return (
    <div className="cs-grid3 rk-grid rk-skeleton" aria-busy="true" aria-label="Loading Odin plan">
      <aside className="cs-col cs-col-left">
        <div className="cs-box"><div className="sk sk-eye" /><div className="cs-sk-row" style={{ padding: '8px 0' }}><div className="sk sk-ring" style={{ width: 92, height: 92, margin: 0 }} /><div className="cs-sk-lines"><div className="sk sk-line w60" /><div className="sk sk-line w50" /><div className="sk sk-pill" style={{ height: 22, width: 120 }} /></div></div><div className="sk sk-line w85" /><div className="sk sk-line w70" /><div className="sk sk-line w85" /><div className="sk sk-line w50" /></div>
        <div className="cs-box"><div className="cs-viz-headrow"><div className="sk sk-eye" /><div className="sk sk-pill" style={{ height: 26, width: 96 }} /></div><div className="sk sk-line w50" style={{ height: 22, margin: '12px 0 10px' }} /><div className="sk sk-strip" style={{ height: 96 }} /></div>
      </aside>
      <main className="cs-col cs-col-center">
        <div className="cs-detail rk-sk-detail"><div className="sk sk-eye center" style={{ marginBottom: 16 }} /><div className="sk sk-line w50" style={{ height: 24 }} /><div className="sk sk-line w70" />{Array.from({ length: 3 }, (_, i) => <div key={i} className="cs-sk-row"><div className="sk sk-dot" /><div className="cs-sk-lines"><div className="sk sk-line w85" /><div className="sk sk-line w55" /></div></div>)}<div className="sk sk-cta rk-sk-grow" /></div>
      </main>
      <aside className="cs-col cs-col-right">
        <div className="cs-window"><div className="sk sk-eye" style={{ margin: '2px 2px 12px' }} /><div className="cs-sk-tiles">{Array.from({ length: 12 }, (_, i) => <div key={i} className="sk sk-tile" />)}</div></div>
      </aside>
    </div>
  )
}

function OdinShell({ children }) {
  return (
    <div className="rk-page">
      <div className="pagehead reveal">
        <Link to="/" className="back" aria-label="Back to home"><IconBack /></Link>
        <div className="htx"><div className="eye">Full Stack · JavaScript</div><h1>Full Stack</h1></div>
      </div>
      {children}
    </div>
  )
}

export default function Odin() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setReady(true); return }
    const t = setTimeout(() => setReady(true), 620); return () => clearTimeout(t)
  }, [])
  const [done, setDone] = useStore('odin:done', {})
  const [pacing, setPacing] = useStore('odin:pacing', ODIN_DEFAULT_PACING)
  const [selDay, setSelDay] = useState(null)
  const [page, setPage] = useState(0)
  const swipeX = useRef(0)

  const days = useMemo(() => packOdinDays(ODIN_ITEMS, ODIN_PACE), [])
  const total = days.length
  const isDone = (r) => !!done[r.key]
  const toggle = (r) => setDone((s) => { const n = { ...s }; if (n[r.key]) delete n[r.key]; else n[r.key] = new Date().toISOString(); return n })
  const markDay = (rows, complete) => setDone((s) => { const n = { ...s }; rows.forEach((r) => { if (complete) n[r.key] = new Date().toISOString(); else delete n[r.key] }); return n })

  // Pacing: map each unit index (1-based) to a plan-day number.
  // pacing=1: Day 1,2,3,...  pacing=2: Day 1,1,2,2,...  pacing=3: Day 1,1,1,2,2,2,...
  const p = Math.max(1, Math.min(3, pacing || ODIN_DEFAULT_PACING))
  const planDay = (unitN) => Math.ceil(unitN / p)
  const planDayCount = planDay(total)
  const dayLabel = (unitN) => unitN ? `Day ${planDay(unitN)}` : ''

  const curIdx = useMemo(() => currentDayIndex(days, done), [days, done])
  // Date-based schedule with 2 days of work each Sat/Sun (weekend-double).
  const sched = useMemo(() => scheduleInfo('full-stack', planDayCount), [planDayCount])
  // Focus the first unfinished unit rather than the unit the calendar points at:
  // working ahead used to pin a unit already ticked off, and falling behind used to
  // skip past unfinished work. The "Today" badge stays date-based.
  const focusDay = Math.min(curIdx, total)
  const isToday = (n) => sched.todaySet.has(planDay(n))
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
  }, [total, curIdx]) // eslint-disable-line

  const { done: doneCount, pct } = odinPct(done)
  const cstats = courseStats(done)
  // A plan-day holds `p` units and is done only once EVERY one of them is (the final
  // day may be short). planDay() rounds up — it maps a unit to its containing day —
  // so reusing it here credited a whole day for a single finished unit.
  const { doneDays: donePlanDays } = odinPlanProgress(days, p, done)
  const remaining = Math.max(0, planDayCount - donePlanDays)
  const allComplete = doneCount >= ODIN_ITEMS.length
  const behind = Math.max(0, sched.due - donePlanDays)
  const ahead = Math.max(0, donePlanDays - sched.due)
  const paceText = allComplete ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track'
  const paceCls = allComplete ? 'ok' : behind ? 'late' : ahead ? 'ok' : 'ontrack'

  const activeRows = days[active - 1]
  const dayItem = activeRows[0]
  const isSpan = activeRows.length === 1 && dayItem.spanTotal > 1
  const tech = techForDay(activeRows)

  const pageCount = Math.ceil(total / PAGE)
  const pg = Math.min(page, pageCount - 1)
  const start = pg * PAGE
  const slice = days.slice(start, start + PAGE)

  if (!ready) return <OdinShell><OdinSkeleton /></OdinShell>

  return (
    <OdinShell>
    <div className="cs-grid3 rk-grid">
      <aside className="cs-col cs-col-left reveal">
        <div className="cs-box rk-stats">
          <div className="cs-panel-eye">Full Stack · ~{ODIN_PACE.toFixed(1)}h/day</div>
          <div className="rk-stat-body">
            <SmallRing pct={pct} size={92} stroke={9} />
            <div className="rk-stat-info">
              <div className="cs-head-day">{dayLabel(focusDay)} <span>/ {planDayCount} days</span></div>
              <div className="cs-head-sub">{doneCount} of {ODIN_ITEMS.length} items · {ODIN_TOTAL_HOURS}h</div>
              <span className={`rpace ${paceCls}`}>{paceText}</span>
            </div>
          </div>
          <div className="rk-vols odin-vols">
            {cstats.map((c) => (
              <div className="rk-vol" key={c.course}>
                <span className="rk-vol-n odin-vol-n">{SHORT[c.course] || c.course}</span>
                <span className="rk-vol-bar"><i style={{ width: c.pct + '%' }} /></span>
                <span className="rk-vol-p">{c.pct}%</span>
              </div>
            ))}
          </div>
          <div className="rk-finish">{doneCount >= ODIN_ITEMS.length ? 'Path complete — you did it.' : <>{remaining} day{remaining === 1 ? '' : 's'} left</>}</div>
        </div>
        <div className="cs-box cs-box-pace">
          <div className="cs-pace">
            <div className="cs-pace-l"><span className="cs-pace-t">Daily pace</span><span className="cs-pace-s">{p === 1 ? '1 unit/day' : `${p} units/day`} · finishes in {planDayCount} days</span></div>
            <Segmented value={p} onChange={setPacing} options={[1, 2, 3].map((v) => ({ value: v, label: `${v}` }))} />
          </div>
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
            <span className="cs-detail-eye">{isToday(active) ? 'Today · ' : ''}{dayLabel(active)}</span>
            <button className="cs-nav-arrow" onClick={() => goDay(1)} disabled={active >= total} aria-label="Next day">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
          <div className="odin-detail">
            <div className="rk-detail-top">
              <span className="uchip">{dayItem.course}</span>
              {isToday(active) ? <span className="rk-today-badge">Today</span> : null}
              <span className="odin-hrs">{fmtHours(dayHours(activeRows))}</span>
            </div>
            {isSpan ? (
              <>
                <div className="rk-pages">{dayItem.title.replace(/^Project: /, '')}</div>
                <div className="rk-chapters">{dayItem.section} · Project — day {dayItem.spanPart} of {dayItem.spanTotal}</div>
                <label className="rk-notes-label">Session</label>
                <div className="odin-items">
                  <div className={isDone(dayItem) ? 'odin-item done' : 'odin-item'}>
                    <Check done={isDone(dayItem)} onClick={() => toggle(dayItem)} label={`Toggle ${dayItem.title}`} />
                    <div className="odin-item-body"><div className="odin-item-t">{dayItem.title}</div><div className="odin-item-m">Project · ~{dayItem.hours}h total · checked once complete</div></div>
                    <a className="odin-open" href={dayItem.url} target="_blank" rel="noreferrer" aria-label={`Open ${dayItem.title} in a new tab`}>Open ↗</a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rk-pages">{activeRows.length} {activeRows.length === 1 ? 'item' : 'items'} today</div>
                <div className="rk-chapters">{[...new Set(activeRows.map((r) => r.section))].join(' · ')}</div>
                <label className="rk-notes-label">Today's items</label>
                <div className="odin-items">
                  {activeRows.map((it) => (
                    <div className={isDone(it) ? 'odin-item done' : 'odin-item'} key={it.key}>
                      <Check done={isDone(it)} onClick={() => toggle(it)} label={`Toggle ${it.title}`} />
                      <div className="odin-item-body">
                        <div className="odin-item-t">{it.title}{it.type === 'project' ? <span className="odin-tag">Project</span> : null}</div>
                        <div className="odin-item-m">{it.section} · {fmtHours(it.dayHours)}</div>
                      </div>
                      <a className="odin-open" href={it.url} target="_blank" rel="noreferrer" aria-label={`Open ${it.title} in a new tab`} onClick={(e) => e.stopPropagation()}>Open ↗</a>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="odin-stacklogo" aria-hidden="true">
              <TechLogo tech={tech} size={128} />
              <span className="odin-stacklogo-cap">Today's stack · {TECH_LABEL[tech] || 'Full Stack'}</span>
            </div>
            <button className={activeRows.every((r) => isDone(r)) ? 'rbtn done' : 'rbtn'} onClick={() => markDay(activeRows, !activeRows.every((r) => isDone(r)))}>
              {activeRows.every((r) => isDone(r)) ? 'Completed ✓' : 'Mark day complete'}
            </button>
          </div>
        </div>
      </main>

      <aside className="cs-col cs-col-right reveal">
        <div className="cs-window">
          <div className="cs-window-h">Full path · {planDayCount} days</div>
          <div className="cs-window-scroll">
            <div className="cs-cellgrid">
              {slice.map((rows, i) => {
                const n = start + i + 1
                const allDone = rows.every((r) => done[r.key])
                const c = rows[0].course
                const cls = 'cs-cell' + (allDone ? ' complete' : '') + (isToday(n) ? ' cs-today' : '') + (n === active ? ' sel' : '')
                return (
                  <button key={n} className={cls} style={{ animationDelay: `${Math.min(i * 8, 200)}ms` }} onClick={() => setSelDay(n)} aria-label={`${dayLabel(n)}, ${SHORT[c] || c}${isToday(n) ? ', today' : ''}`}>
                    {allDone ? <span className="cs-cell-check"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span> : <SmallRing pct={n === active ? 100 : 0} size={26} stroke={3} showValue={false} />}
                    <span className="cs-cell-n">{dayLabel(n)}</span>
                    <span className="cs-cell-m">{SHORT[c] || c}</span>
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
    </OdinShell>
  )
}
