import { useEffect, useMemo, useRef, useState } from 'react'
import { useReading, activityRange } from '../lib/progress.js'
import { isScheduled, scheduleInfo, fmtDate, fmtDateFull } from '../lib/schedule.js'
import { SmallRing } from './ui.jsx'

const RK_PAGE = 12
const RK_RANGES = [{ k: 14, label: '2W' }, { k: 42, label: '6W' }, { k: 84, label: '12W' }]

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

function ReadingConsistency() {
  const [ri, setRi] = useState(1)
  const swipeX = useRef(0)
  const range = RK_RANGES[ri]
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
  const move = (dir) => setRi((v) => Math.min(RK_RANGES.length - 1, Math.max(0, v + dir)))
  return (
    <div className="cs-box cs-box-viz"
      onTouchStart={(e) => { swipeX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - swipeX.current; if (Math.abs(dx) > 45) move(dx < 0 ? 1 : -1) }}>
      <div className="cs-viz-headrow">
        <span className="cs-panel-eye">Consistency</span>
        <div className="cs-viz-ranges" role="tablist">
          {RK_RANGES.map((r, i) => <button key={r.k} className={'cs-range' + (i === ri ? ' on' : '')} onClick={() => setRi(i)} aria-selected={i === ri}>{r.label}</button>)}
        </div>
      </div>
      <div className="cs-viz-stat">{activeDays} <em>active {activeDays === 1 ? 'day' : 'days'} · last {range.label}</em></div>
      <svg className="cs-line" viewBox={`0 0 ${W} ${H}`} width="100%" height="120" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="rkline-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0.16" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></linearGradient></defs>
        {grid.map((y, i) => <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth="1" />)}
        {area ? <path d={area} fill="url(#rkline-a)" /> : null}
        {line ? <path d={line} fill="none" stroke="#cfcfcf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.3" fill="#7a7a7a" />)}
        {pts.length ? <circle cx={tip[0]} cy={tip[1]} r="4" fill="#fafafa" /> : null}
      </svg>
    </div>
  )
}

function RkSkeleton() {
  return (
    <div className="cs-grid3 rk-grid rk-skeleton" aria-busy="true" aria-label="Loading reading plan">
      <aside className="cs-col cs-col-left">
        <div className="cs-box"><div className="sk sk-eye" /><div className="cs-sk-row" style={{ padding: '8px 0' }}><div className="sk sk-ring" style={{ width: 92, height: 92, margin: 0 }} /><div className="cs-sk-lines"><div className="sk sk-line w60" /><div className="sk sk-line w50" /><div className="sk sk-pill" style={{ height: 22, width: 120 }} /></div></div><div className="sk sk-line w85" /><div className="sk sk-line w70" /><div className="sk sk-line w50" /></div>
        <div className="cs-box"><div className="cs-viz-headrow"><div className="sk sk-eye" /><div className="sk sk-pill" style={{ height: 26, width: 96 }} /></div><div className="sk sk-line w50" style={{ height: 22, margin: '12px 0 10px' }} /><div className="sk sk-strip" style={{ height: 96 }} /></div>
      </aside>
      <main className="cs-col cs-col-center">
        <div className="cs-detail rk-sk-detail">
          <div className="sk sk-eye center" style={{ marginBottom: 16 }} />
          <div className="sk sk-pill" style={{ height: 22, width: 84, marginBottom: 12 }} />
          <div className="sk sk-line w50" style={{ height: 26 }} />
          <div className="sk sk-line w70" />
          <div className="sk sk-line w40" style={{ margin: '6px 0 14px' }} />
          <div className="sk sk-line w60 rk-sk-grow" />
          <div className="sk sk-cta" style={{ marginTop: 14 }} />
        </div>
      </main>
      <aside className="cs-col cs-col-right">
        <div className="cs-window"><div className="sk sk-eye" style={{ margin: '2px 2px 12px' }} /><div className="cs-sk-tiles">{Array.from({ length: 12 }, (_, i) => <div key={i} className="sk sk-tile" />)}</div></div>
      </aside>
    </div>
  )
}

export default function ReadingTracker({ planId, chapterFocus = false }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setReady(true); return }
    const t = setTimeout(() => setReady(true), 620)
    return () => clearTimeout(t)
  }, [planId])
  const { plan, done, notes, toggle, setNote, doneCount, total, pct, currentDay, expectedDay, behind, ahead, finished } = useReading(planId)
  const days = plan.days
  // Date-based schedule (System Design). ML plans stay day-numbered.
  const sched = isScheduled(planId)
  const info = useMemo(() => (sched ? scheduleInfo(planId, total) : null), [sched, planId, total])
  const focusDay = sched ? Math.min(info.todayN, total) : Math.min(currentDay, total)
  const isTodayN = (n) => (sched ? info.todaySet.has(n) : n === currentDay)
  const dayLabel = (n) => (sched ? fmtDate(info.dates[n - 1]) : `Day ${n}`)
  const [selDay, setSelDay] = useState(null)
  const [page, setPage] = useState(0)
  const swipeX = useRef(0)
  const active = selDay && selDay <= total ? selDay : focusDay
  useEffect(() => { setPage(Math.floor((active - 1) / RK_PAGE)) }, [active])
  const goDay = (delta) => setSelDay((prev) => {
    const cur = prev && prev <= total ? prev : focusDay
    return Math.min(total, Math.max(1, cur + delta))
  })
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement
      if (el && (/^(input|textarea|select)$/i.test(el.tagName) || el.isContentEditable)) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); goDay(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goDay(1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total, currentDay]) // eslint-disable-line

  const groups = useMemo(() => {
    const m = []
    days.forEach((d) => { const g = m.find((x) => x.name === d.group); if (g) g.days.push(d); else m.push({ name: d.group, days: [d] }) })
    return m
  }, [days])
  const curDayObj = days[Math.min(currentDay, total) - 1] || days[0]
  const curGroup = groups.find((g) => g.name === curDayObj.group) || groups[0]
  const cgTotal = curGroup ? curGroup.days.length : 0
  const cgDone = curGroup ? curGroup.days.filter((d) => done[d.n]).length : 0
  const cgPct = cgTotal ? Math.round((cgDone / cgTotal) * 100) : 0
  const cgIdx = curGroup ? curGroup.days.findIndex((d) => d.n === curDayObj.n) + 1 : 0
  const chapterNo = curGroup ? groups.findIndex((g) => g.name === curGroup.name) + 1 : 0
  const remaining = total - doneCount
  const estFinish = sched && info.finishISO ? new Date(info.finishISO + 'T00:00') : new Date(Date.now() + remaining * 86400000)
  const activeDay = days[active - 1]
  const dayPages = activeDay.to - activeDay.from + 1
  const readMins = Math.max(5, Math.round(dayPages * 2))
  const paceText = finished ? 'Complete' : behind ? `${behind} day${behind > 1 ? 's' : ''} behind` : ahead ? `${ahead} day${ahead > 1 ? 's' : ''} ahead` : 'On track'
  const paceCls = finished ? 'ok' : behind ? 'late' : ahead ? 'ok' : 'ontrack'

  const pageCount = Math.ceil(total / RK_PAGE)
  const pg = Math.min(page, pageCount - 1)
  const start = pg * RK_PAGE
  const slice = days.slice(start, start + RK_PAGE)

  if (!ready) return <RkSkeleton />

  return (
    <div className="cs-grid3 rk-grid">
      <aside className="cs-col cs-col-left reveal">
        {chapterFocus ? (
          <div className="cs-box rk-stats rk-stats-min">
            <div className="rk-curchap-eye">Current chapter{groups.length > 1 ? ` · ${chapterNo} of ${groups.length}` : ''}</div>
            <div className="rk-min-name">{curGroup ? curGroup.name : ''}</div>
            <div className="rk-min-bar">
              <span className="rk-vol-bar rk-curchap-bar"><i style={{ width: cgPct + '%' }} /></span>
              <span className="rk-curchap-p">{cgPct}%</span>
            </div>
            <div className="rk-finish">{finished ? 'Plan complete — nicely done.' : <>Est. finish <b>{estFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</b> · {remaining} day{remaining === 1 ? '' : 's'} left</>}</div>
          </div>
        ) : (
          <div className="cs-box rk-stats">
            <div className="cs-panel-eye">{plan.source} · {plan.perDay} pp/day</div>
            <div className="rk-stat-body">
              <SmallRing pct={pct} size={92} stroke={9} />
              <div className="rk-stat-info">
                <div className="cs-head-day">{sched ? fmtDate(info.dates[focusDay - 1]) : `Day ${focusDay}`} <span>/ {total} days</span></div>
                <div className="cs-head-sub">{doneCount} of {total} days done</div>
                <span className={`rpace ${paceCls}`}>{paceText}{finished ? '' : ` · target ${expectedDay}`}</span>
              </div>
            </div>
            <div className="rk-vols">
              {groups.map((g) => {
                const gd = g.days.filter((d) => done[d.n]).length
                const gp = g.days.length ? Math.round((gd / g.days.length) * 100) : 0
                return (
                  <div className="rk-vol" key={g.name}>
                    <span className="rk-vol-n">{g.name}</span>
                    <span className="rk-vol-bar"><i style={{ width: gp + '%' }} /></span>
                    <span className="rk-vol-p">{gp}%</span>
                  </div>
                )
              })}
            </div>
            <div className="rk-finish">{finished ? 'Plan complete — nicely done.' : <>Est. finish <b>{estFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</b> · {remaining} day{remaining === 1 ? '' : 's'} left</>}</div>
          </div>
        )}
        <ReadingConsistency />
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
            <span className="cs-detail-eye">{isTodayN(active) ? 'Today · ' : ''}{sched ? fmtDateFull(info.dates[active - 1]) : `Day ${active} of ${total}`}</span>
            <button className="cs-nav-arrow" onClick={() => goDay(1)} disabled={active >= total} aria-label="Next day">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
          <div className="rk-detail">
            <div className="rk-detail-top">
              <span className="uchip">{activeDay.group}</span>
              {isTodayN(active) ? <span className="rk-today-badge">Today</span> : null}
              {done[active] ? <span className="rk-done-badge">Done</span> : null}
            </div>
            <div className="rk-pages">Page {activeDay.from}–{activeDay.to}</div>
            <div className="rk-chapters">{activeDay.chapters.join(' · ')}</div>
            <div className="rk-meta">
              <span className="rk-meta-i">{dayPages} pages</span>
              <span className="rk-meta-dot" />
              <span className="rk-meta-i">~{readMins} min read</span>
            </div>
            <label className="rk-notes-label" htmlFor={`rk-note-${active}`}>Notes</label>
            <textarea id={`rk-note-${active}`} className="rnote" placeholder="Jot down key ideas, diagrams to redraw, follow-ups…" value={notes[active] || ''} onChange={(e) => setNote(active, e.target.value)} />
            <button className={done[active] ? 'rbtn done' : 'rbtn'} onClick={() => toggle(active)}>{done[active] ? 'Completed ✓' : 'Mark day complete'}</button>
          </div>
        </div>
      </main>

      <aside className="cs-col cs-col-right reveal">
        <div className="cs-window">
          <div className="cs-window-h">Reading plan · {total} days</div>
          <div className="cs-window-scroll">
            <div className="cs-cellgrid">
              {slice.map((d, i) => {
                const n = start + i + 1
                const isDone = !!done[n]
                const cls = 'cs-cell' + (isDone ? ' complete' : '') + (isTodayN(n) ? ' cs-today' : '') + (n === active ? ' sel' : '')
                return (
                  <button key={n} className={cls} style={{ animationDelay: `${Math.min(i * 8, 200)}ms` }} onClick={() => setSelDay(n)} aria-label={`${dayLabel(n)}, pages ${d.from} to ${d.to}${isTodayN(n) ? ', today' : ''}`}>
                    {isDone ? <span className="cs-cell-check"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span> : <SmallRing pct={n === active ? 100 : 0} size={26} stroke={3} showValue={false} />}
                    <span className="cs-cell-n">{dayLabel(n)}{notes[n] ? <i className="rk-note-dot" /> : null}</span>
                    <span className="cs-cell-m">pp. {d.from}–{d.to}</span>
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
  )
}
