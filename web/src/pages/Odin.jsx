import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBack, TechLogo, TECH_LABEL } from '../components/icons.jsx'
import { SmallRing } from '../components/ui.jsx'
import { useStore } from '../lib/store.js'
import { activityRange } from '../lib/progress.js'
import { scheduleInfo, fmtDate, fmtDateFull } from '../lib/schedule.js'
import {
  ODIN_ITEMS, ODIN_COURSE_ORDER, ODIN_TOTAL_HOURS, ODIN_PACE,
  packOdinDays, dayHours, fmtHours, courseStats, currentDayIndex, writeOdinStats, odinPct, techForDay,
} from '../lib/odin.js'

const PAGE = 12
const SHORT = { Foundations: 'FND', 'Intermediate HTML and CSS': 'HTML', JavaScript: 'JS', 'Advanced HTML and CSS': 'ADV', React: 'RCT', Databases: 'DB', NodeJS: 'NODE', 'Getting Hired': 'HIRE' }
const RANGES = [{ k: 14, label: '2W' }, { k: 42, label: '6W' }, { k: 84, label: '12W' }]

function Check({ done, onClick, label }) {
  return (
    <button className={done ? 'rcheck on' : 'rcheck'} onClick={onClick} aria-pressed={done} aria-label={label}>
      {done && <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  )
}

function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

function Consistency() {
  const [ri, setRi] = useState(1)
  const swipeX = useRef(0)
  const range = RANGES[ri]
  const { series, activeDays } = useMemo(() => {
    const arr = activityRange(range.k)
    const N = 14, size = Math.max(1, Math.ceil(arr.length / N)), series = []
    for (let i = 0; i < arr.length; i += size) series.push(arr.slice(i, i + size).reduce((a, c) => a + c.count, 0))
    return { series, activeDays: arr.filter((d) => d.count > 0).length }
  }, [ri])
  const W = 300, H = 120, pad = 8, top = 12, bot = 12
  const max = Math.max(1, ...series)
  const pts = series.map((v, i) => [pad + i * ((W - 2 * pad) / Math.max(1, series.length - 1)), H - bot - (v / max) * (H - top - bot)])
  const line = smoothPath(pts)
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z` : ''
  const tip = pts[pts.length - 1] || [0, 0]
  const grid = [0.25, 0.5, 0.75, 1].map((g) => H - bot - g * (H - top - bot))
  const move = (dir) => setRi((v) => Math.min(RANGES.length - 1, Math.max(0, v + dir)))
  return (
    <div className="cs-box cs-box-viz"
      onTouchStart={(e) => { swipeX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - swipeX.current; if (Math.abs(dx) > 45) move(dx < 0 ? 1 : -1) }}>
      <div className="cs-viz-headrow">
        <span className="cs-panel-eye">Consistency</span>
        <div className="cs-viz-ranges" role="tablist">
          {RANGES.map((r, i) => <button key={r.k} className={'cs-range' + (i === ri ? ' on' : '')} onClick={() => setRi(i)} aria-selected={i === ri}>{r.label}</button>)}
        </div>
      </div>
      <div className="cs-viz-stat">{activeDays} <em>active {activeDays === 1 ? 'day' : 'days'} · last {range.label}</em></div>
      <svg className="cs-line" viewBox={`0 0 ${W} ${H}`} width="100%" height="120" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="odinline-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0.16" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></linearGradient></defs>
        {grid.map((y, i) => <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth="1" />)}
        {area ? <path d={area} fill="url(#odinline-a)" /> : null}
        {line ? <path d={line} fill="none" stroke="#cfcfcf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.3" fill="#7a7a7a" />)}
        {pts.length ? <circle cx={tip[0]} cy={tip[1]} r="4" fill="#fafafa" /> : null}
      </svg>
    </div>
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
  const [selDay, setSelDay] = useState(null)
  const [page, setPage] = useState(0)
  const swipeX = useRef(0)

  const days = useMemo(() => packOdinDays(ODIN_ITEMS, ODIN_PACE), [])
  const total = days.length
  const isDone = (r) => !!done[r.key]
  const toggle = (r) => setDone((s) => { const n = { ...s }; if (n[r.key]) delete n[r.key]; else n[r.key] = new Date().toISOString(); return n })
  const markDay = (rows, complete) => setDone((s) => { const n = { ...s }; rows.forEach((r) => { if (complete) n[r.key] = new Date().toISOString(); else delete n[r.key] }); return n })

  const curIdx = useMemo(() => currentDayIndex(days, done), [days, done])
  // Date-based schedule with 2 days of work each Sat/Sun (weekend-double).
  const sched = useMemo(() => scheduleInfo('full-stack', total), [total])
  const focusDay = Math.min(sched.todayN || curIdx, total)
  const isToday = (n) => sched.todaySet.has(n)
  const dayLabel = (n) => {
    const dt = sched.dates[n - 1]
    if (n > 1 && sched.dates[n - 2] === dt) return `${fmtDate(dt)} ②`
    if (n < total && sched.dates[n] === dt) return `${fmtDate(dt)} ①`
    return fmtDate(dt)
  }
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
  const doneDays = days.filter((rows) => rows.every((r) => done[r.key])).length
  const remaining = total - doneDays
  const allComplete = doneCount >= ODIN_ITEMS.length
  const behind = Math.max(0, sched.due - doneDays)
  const ahead = Math.max(0, doneDays - sched.due)
  const paceText = allComplete ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track'
  const paceCls = allComplete ? 'ok' : behind ? 'late' : ahead ? 'ok' : 'ontrack'
  const estFinish = sched.finishISO ? new Date(sched.finishISO + 'T00:00') : new Date(Date.now() + remaining * 86400000)

  useEffect(() => { writeOdinStats(done) }, [done])

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
              <div className="cs-head-day">{fmtDate(sched.dates[focusDay - 1])} <span>/ {total} days</span></div>
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
          <div className="rk-finish">{doneCount >= ODIN_ITEMS.length ? 'Path complete — you did it.' : <>Est. finish <b>{estFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</b> · {remaining} day{remaining === 1 ? '' : 's'} left</>}</div>
        </div>
        <Consistency />
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
            <span className="cs-detail-eye">{isToday(active) ? 'Today · ' : ''}{fmtDateFull(sched.dates[active - 1])}{sched.dates[active - 1] && (sched.dates[active - 2] === sched.dates[active - 1] || sched.dates[active] === sched.dates[active - 1]) ? ' · session ' + (sched.dates[active - 2] === sched.dates[active - 1] ? '2' : '1') : ''}</span>
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
          <div className="cs-window-h">Full path · {total} days</div>
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
