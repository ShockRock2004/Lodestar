import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBack } from '../components/icons.jsx'
import { SmallRing, EmptyState, Segmented } from '../components/ui.jsx'
import { supabase } from '../lib/supabase.js'
import { useStore, setStore } from '../lib/store.js'
import { PACE_OPTIONS, DEFAULT_PACE, PACE_LABEL, makeRowMins, packInterleaved, dayMinutes, currentDayIndex, fmtDuration } from '../lib/csplan.js'
import { activityRange } from '../lib/progress.js'
import { scheduleInfo, fmtDate, fmtDateFull } from '../lib/schedule.js'

const SUBJECT_ORDER = ['Operating Systems', 'Computer Networks', 'DBMS']
const SHORT = { 'Operating Systems': 'OS', 'Computer Networks': 'CN', DBMS: 'DBMS' }
const RINGC = { OS: '#f4f4f4', CN: '#9c9c9c', DBMS: '#565656' }
const CS_PAGE = 15
const lines = (s) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean)

function Play() {
  return <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
}
function Check({ done, onClick, label }) {
  return (
    <button className={done ? 'rcheck on' : 'rcheck'} onClick={onClick} aria-pressed={done} aria-label={label}>
      {done && <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  )
}

function ConcentricRings({ rings, size = 144, center }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = requestAnimationFrame(() => setM(true)); return () => cancelAnimationFrame(t) }, [])
  const sw = 9, gap = 6, pad = 9
  return (
    <div className="cs-rings" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {rings.map((r, i) => {
          const radius = size / 2 - sw / 2 - pad - i * (sw + gap)
          const c = 2 * Math.PI * radius
          const off = c - c * ((m ? r.pct : 0) / 100)
          return (
            <g key={i}>
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={sw} strokeLinecap="round" />
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.color} strokeWidth={sw} strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)', transitionDelay: `${i * 0.12}s` }} />
            </g>
          )
        })}
      </svg>
      {center != null && <span className="cs-rings-c">{center}</span>}
    </div>
  )
}

function TopicRow({ r, done, toggle, showHeading = true, divider = false }) {
  const topics = lines(r.topic_name), urls = lines(r.video_urls)
  return (
    <div className={'csrow' + (done ? ' done' : '') + (divider ? ' cs-divider' : '')}>
      <Check done={done} onClick={() => toggle(r.id)} label={`Toggle ${r.chapter}`} />
      <div className="csbody">
        {showHeading && <div className="csrow-h">{r.subject}</div>}
        <ul className="cstopics">
          {topics.map((t, i) => (
            <li key={i}>
              <span className="cs-topic-t">{t}</span>
              {urls[i] ? <a className="cs-watch" href={urls[i]} target="_blank" rel="noreferrer"><Play /> Watch</a> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SubjectBlock({ group, isDone, markAll, divider }) {
  const rows = group.rows
  const allDone = rows.length > 0 && rows.every((r) => isDone(r.id))
  return (
    <div className={'csrow' + (allDone ? ' done' : '') + (divider ? ' cs-divider' : '')}>
      <Check done={allDone} onClick={() => markAll(rows, !allDone)} label={`Toggle ${group.subject}`} />
      <div className="csbody">
        <div className="csrow-h">{group.subject}</div>
        <ul className="cstopics">
          {rows.flatMap((r) => {
            const topics = lines(r.topic_name), urls = lines(r.video_urls)
            return topics.map((t, i) => (
              <li key={r.id + '-' + i}>
                <span className="cs-topic-t">{t}</span>
                {urls[i] ? <a className="cs-watch" href={urls[i]} target="_blank" rel="noreferrer"><Play /> Watch</a> : null}
              </li>
            ))
          })}
        </ul>
      </div>
    </div>
  )
}

function SessionCard({ n, rows, mins, isDone, toggle, expanded, onToggle, today, markAll, pinned, label }) {
  const total = rows.length
  const d = rows.filter((r) => isDone(r.id)).length
  const subjects = [...new Set(rows.map((r) => SHORT[r.subject] || r.subject))]
  const pct = total ? Math.round((d / total) * 100) : 0
  return (
    <div className={'cs-day' + (today ? ' now' : '') + (d === total ? ' complete' : '')}>
      {pinned ? (
        <div className="cs-detail-meta">
          <SmallRing pct={pct} size={30} stroke={4} showValue={false} />
          <span>{fmtDuration(mins)} · {subjects.join(' · ')} · <b className={d === total ? 'cs-meta-done' : ''}>{d}/{total} done</b></span>
        </div>
      ) : (
        <button className="cs-day-h" onClick={onToggle} aria-expanded={expanded}>
          <SmallRing pct={pct} size={34} stroke={4} showValue={false} />
          <span className="cs-day-main">
            <span className="cs-day-n">{label || `Day ${n}`}{today ? <em>Today</em> : null}</span>
            <span className="cs-day-meta">{fmtDuration(mins)} · {subjects.join(' · ')} · {d}/{total} done</span>
          </span>
          {!today && (
            <span className={expanded ? 'cs-chev open' : 'cs-chev'}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          )}
        </button>
      )}
      {expanded && (() => {
        const displayRows = [...rows].sort((a, b) => {
          const su = SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject)
          return su !== 0 ? su : (a.id || 0) - (b.id || 0)
        })
        const groups = []
        displayRows.forEach((r) => { const g = groups[groups.length - 1]; if (g && g.subject === r.subject) g.rows.push(r); else groups.push({ subject: r.subject, rows: [r] }) })
        return (
          <div className="cs-day-body">
            {groups.map((g, gi) => <SubjectBlock key={g.subject} group={g} isDone={isDone} markAll={markAll} divider={gi > 0} />)}
            {markAll ? <button className="rbtn" onClick={() => markAll(rows, d < total)}>{d < total ? 'Mark session complete' : 'Completed ✓'}</button> : null}
          </div>
        )
      })()}
    </div>
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

const CS_RANGES = [{ k: 14, label: '2W' }, { k: 42, label: '6W' }, { k: 84, label: '12W' }]

function CsConsistency() {
  const [ri, setRi] = useState(1)
  const swipeX = useRef(0)
  const range = CS_RANGES[ri]
  const { series, activeDays } = useMemo(() => {
    const arr = activityRange(range.k)
    const N = 14
    const size = Math.max(1, Math.ceil(arr.length / N))
    const series = []
    for (let i = 0; i < arr.length; i += size) series.push(arr.slice(i, i + size).reduce((a, c) => a + c.count, 0))
    return { series, activeDays: arr.filter((d) => d.count > 0).length }
  }, [ri])
  const W = 300, H = 100, pad = 8
  const max = Math.max(1, ...series)
  const pts = series.map((v, i) => [pad + i * ((W - 2 * pad) / Math.max(1, series.length - 1)), H - 9 - (v / max) * (H - 24)])
  const line = smoothPath(pts)
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z` : ''
  const tip = pts[pts.length - 1] || [0, 0]
  const move = (dir) => setRi((v) => Math.min(CS_RANGES.length - 1, Math.max(0, v + dir)))
  return (
    <div className="cs-box cs-box-viz"
      onTouchStart={(e) => { swipeX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - swipeX.current; if (Math.abs(dx) > 45) move(dx < 0 ? 1 : -1) }}>
      <div className="cs-viz-headrow">
        <span className="cs-panel-eye">Consistency</span>
        <div className="cs-viz-ranges" role="tablist">
          {CS_RANGES.map((r, i) => <button key={r.k} className={'cs-range' + (i === ri ? ' on' : '')} onClick={() => setRi(i)} aria-selected={i === ri}>{r.label}</button>)}
        </div>
      </div>
      <div className="cs-viz-stat">{activeDays} <em>active {activeDays === 1 ? 'day' : 'days'} · last {range.label}</em></div>
      <svg className="cs-line" viewBox={`0 0 ${W} ${H}`} width="100%" height="100" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="csline-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0.16" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></linearGradient></defs>
        {area ? <path d={area} fill="url(#csline-a)" /> : null}
        {line ? <path d={line} fill="none" stroke="#cfcfcf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.3" fill="#7a7a7a" />)}
        {pts.length ? <circle cx={tip[0]} cy={tip[1]} r="4" fill="#fafafa" /> : null}
      </svg>
    </div>
  )
}

function CsSkeleton() {
  return (
    <div className="cs-grid3 cs-skeleton" aria-busy="true" aria-label="Loading curriculum">
      <aside className="cs-col cs-col-left">
        <div className="cs-box"><div className="sk sk-eye" /><div className="sk sk-ring" /><div className="sk sk-line w50" /><div className="sk sk-line w70" /></div>
        <div className="cs-box"><div className="sk sk-eye" /><div className="sk sk-pill" /></div>
        <div className="cs-box"><div className="sk sk-eye" /><div className="sk sk-strip" /><div className="sk sk-line w60" /></div>
      </aside>
      <main className="cs-col cs-col-center">
        <div className="cs-detail"><div className="sk sk-eye center" />
          {Array.from({ length: 4 }, (_, i) => (
            <div className="cs-sk-row" key={i}><div className="sk sk-dot" /><div className="cs-sk-lines"><div className="sk sk-line w85" /><div className="sk sk-line w55" /></div><div className="sk sk-btn" /></div>
          ))}
          <div className="sk sk-cta" />
        </div>
      </main>
      <aside className="cs-col cs-col-right">
        <div className="cs-box"><div className="sk sk-bar" /></div>
        <div className="cs-window"><div className="sk sk-eye" style={{ margin: '2px 2px 12px' }} /><div className="cs-sk-tiles">{Array.from({ length: 9 }, (_, i) => <div key={i} className="sk sk-tile" />)}</div></div>
      </aside>
    </div>
  )
}

export default function CsCore() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useStore('cs:done', {})
  const [pace, setPace] = useStore('cs:pace', DEFAULT_PACE)
  const [sched, setSched] = useStore('cs:sched', null)
  const [q, setQ] = useState('')
  const [selDay, setSelDay] = useState(null)
  const [page, setPage] = useState(0)
  const swipeX = useRef(0)

  useEffect(() => {
    let alive = true
    if (!supabase) { setError('no-config'); return }
    function finish(data) {
      setRows(data || [])
      setStore('cs:topics', (data || []).map((r) => ({ id: r.id, subject: r.subject, chapter: r.chapter, topics: r.topic_name || '' })))
    }
    supabase.from('core_cs_topics').select('id,subject,chapter,topic_name,video_urls,is_completed,duration_mins')
      .then(({ data, error }) => {
        if (!alive) return
        if (error) {
          supabase.from('core_cs_topics').select('id,subject,chapter,topic_name,video_urls,is_completed')
            .then(({ data: d2, error: e2 }) => { if (!alive) return; if (e2) { setError(e2.message || 'fetch-failed'); return } finish(d2) })
          return
        }
        finish(data)
      })
    return () => { alive = false }
  }, [])

  const isDone = (id) => !!done[id]
  const toggle = (id) => setDone((s) => { const n = { ...s }; if (n[id]) delete n[id]; else n[id] = new Date().toISOString(); return n })
  const markAll = (rs, complete) => setDone((s) => { const n = { ...s }; rs.forEach((r) => { if (complete) n[r.id] = new Date().toISOString(); else delete n[r.id] }); return n })

  const rowMins = useMemo(() => (rows ? makeRowMins(rows) : () => 0), [rows])
  const ordered = useMemo(() => {
    if (!rows) return []
    return [...rows].sort((a, b) => {
      const s = SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject)
      return s !== 0 ? s : (a.id || 0) - (b.id || 0)
    })
  }, [rows])
  const idToRow = useMemo(() => Object.fromEntries((rows || []).map((r) => [r.id, r])), [rows])

  // Initialise / reconcile the persisted schedule once the data lands.
  useEffect(() => {
    if (!rows) return
    if (!sched || !sched.length) {
      setSched(packInterleaved(ordered, pace, rowMins).map((d) => d.map((r) => r.id)))
      return
    }
    // Detect DB drift since the schedule was saved: topics added, removed, or reordered.
    const liveIds = new Set(ordered.map((r) => r.id))
    const flat = sched.flat()
    const schedIds = new Set(flat)
    const hasNew = ordered.some((r) => !schedIds.has(r.id))
    const hasGone = flat.some((id) => !liveIds.has(id))
    if (!hasNew && !hasGone) return // already in sync — keep the user's paced arrangement
    // Freeze fully-completed leading days; re-interleave everything else (incl. new topics,
    // minus deleted ones) in canonical curriculum order so nothing is stranded at the end.
    let freeze = 0
    const dayIds = sched.map((day) => day.filter((id) => liveIds.has(id))).filter((day) => day.length)
    while (freeze < dayIds.length && dayIds[freeze].every((id) => done[id])) freeze++
    const frozen = dayIds.slice(0, freeze)
    const frozenIds = new Set(frozen.flat())
    const tail = ordered.filter((r) => !frozenIds.has(r.id))
    setSched([...frozen, ...packInterleaved(tail, pace, rowMins).map((d) => d.map((r) => r.id))])
  }, [rows]) // eslint-disable-line

  // Days come from the persisted schedule (falls back to a fresh pack pre-init).
  const days = useMemo(() => {
    if (!rows) return []
    if (!sched || !sched.length) return packInterleaved(ordered, pace, rowMins)
    return sched.map((a) => a.map((id) => idToRow[id]).filter(Boolean)).filter((d) => d.length)
  }, [rows, sched, idToRow, ordered, pace, rowMins])

  // Re-pace: freeze the leading run of fully-completed days, repack only the rest.
  const changePace = (newPace) => {
    if (newPace === pace) return
    let freeze = 0
    while (freeze < days.length && days[freeze].length && days[freeze].every((r) => isDone(r.id))) freeze++
    const frozen = days.slice(0, freeze)
    const tail = days.slice(freeze).flatMap((d) => d)
    const next = [...frozen, ...packInterleaved(tail, newPace, rowMins)].map((a) => a.map((r) => r.id))
    setSched(next)
    setPace(newPace)
  }

  const curIdx = useMemo(() => currentDayIndex(days, isDone), [days, done])
  // Date-based schedule: each day maps to a calendar date (skips excluded).
  const cal = useMemo(() => scheduleInfo('cs-core', days.length), [days.length])
  const focusDay = Math.min(cal.todayN || curIdx, days.length)
  const active = selDay && selDay <= days.length ? selDay : focusDay
  const goDay = (delta) => setSelDay((prev) => {
    const cur = prev && prev <= days.length ? prev : focusDay
    return Math.min(days.length, Math.max(1, cur + delta))
  })
  useEffect(() => { setPage(Math.floor((active - 1) / CS_PAGE)) }, [active]) // eslint-disable-line
  const total = rows ? rows.length : 0
  const doneCount = rows ? rows.filter((r) => isDone(r.id)).length : 0
  const pct = total ? Math.round((doneCount / total) * 100) : 0
  const allComplete = total > 0 && doneCount === total
  const doneDays = days.filter((rs) => rs.length && rs.every((r) => isDone(r.id))).length
  const remaining = Math.max(0, days.length - doneDays)
  const isToday = (n) => !allComplete && cal.todaySet.has(n)
  const dayLabel = (n) => fmtDate(cal.dates[n - 1])
  const behind = Math.max(0, cal.due - doneDays)
  const ahead = Math.max(0, doneDays - cal.due)
  const paceText = allComplete ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track'
  const paceCls = allComplete ? 'ok' : behind ? 'late' : ahead ? 'ok' : 'ontrack'

  useEffect(() => { if (rows) setStore('cs:stats', { done: doneCount, total, pct }) }, [rows, doneCount, total, pct])

  const subjStats = SUBJECT_ORDER.map((s) => {
    const rs = (rows || []).filter((r) => r.subject === s)
    const d = rs.filter((r) => isDone(r.id)).length
    return { s, short: SHORT[s], total: rs.length, done: d, pct: rs.length ? Math.round((d / rs.length) * 100) : 0 }
  }).filter((x) => x.total)
  const rings = subjStats.map((x) => ({ pct: x.pct, color: RINGC[x.short] || '#888', label: x.short }))

  const searchRows = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return null
    return ordered.filter((r) => `${r.chapter} ${r.subject} ${r.topic_name}`.toLowerCase().includes(t)).slice(0, 40)
  }, [q, ordered])

  return (
    <div className="cs-wrap">
      <div className="pagehead reveal">
        <Link to="/" className="back" aria-label="Back to home"><IconBack /></Link>
        <div className="htx"><div className="eye">Curriculum · Gate Smashers</div><h1>CS Core</h1></div>
      </div>

      {error === "no-config" && <div className="card reveal"><EmptyState title="Supabase not configured">Add your project URL and publishable key to <b>.env.local</b> to load the OS · CN · DBMS curriculum.</EmptyState></div>}
      {error && error !== "no-config" && <div className="card reveal"><EmptyState title="Couldn’t load the curriculum">{error}</EmptyState></div>}
      {!rows && !error && <CsSkeleton />}

{rows && (
        <div className="cs-grid3">
          <aside className="cs-col cs-col-left reveal">
            <div className="cs-box cs-box-plan">
              <div className="cs-panel-eye">Your plan</div>
              <div className="cs-box-plancenter">
                <ConcentricRings rings={rings} center={<><b>{pct}%</b><i>done</i></>} />
                <div className="cs-panel-info">
                  <div className="cs-head-day">{fmtDate(cal.dates[focusDay - 1])} <span>/ {days.length} days</span></div>
                  <div className="cs-head-sub">{doneCount} of {total} topics · {remaining === 0 ? "all caught up" : `${remaining} days left`}</div>
                  <span className={`rpace ${paceCls}`} style={{ marginTop: 6 }}>{paceText}</span>
                  <div className="cs-legend">
                    {subjStats.map((x) => (
                      <div className="cs-leg" key={x.s}><span className="cs-leg-dot" style={{ background: RINGC[x.short] }} /><span className="cs-leg-n">{x.short}</span><b className="cs-leg-p">{x.pct}%</b></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="cs-box cs-box-pace">
              <div className="cs-pace">
                <div className="cs-pace-l"><span className="cs-pace-t">Daily pace</span><span className="cs-pace-s">{PACE_LABEL[pace]}/day · repacks remaining</span></div>
                <Segmented value={pace} onChange={changePace} options={PACE_OPTIONS.map((p) => ({ value: p, label: PACE_LABEL[p] }))} />
              </div>
            </div>
            <CsConsistency />
          </aside>

          <main className="cs-col cs-col-center reveal">
            {searchRows ? (
              <div className="cs-detail">
                <div className="cs-detail-eye">{searchRows.length} match{searchRows.length === 1 ? "" : "es"}</div>
                <div className="cs-searchlist">{searchRows.map((r, i) => <TopicRow key={r.id} r={r} done={isDone(r.id)} toggle={toggle} divider={i > 0} />)}</div>
              </div>
            ) : days.length ? (
              <div className="cs-detail cg-detail"
                onTouchStart={(e) => { swipeX.current = e.touches[0].clientX }}
                onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - swipeX.current; if (Math.abs(dx) > 55) goDay(dx < 0 ? 1 : -1) }}>
                <span className="cg-glow" aria-hidden="true" />
                <div className="cs-detail-head">
                  <button className="cs-nav-arrow" onClick={() => goDay(-1)} disabled={active <= 1} aria-label="Previous day">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                  </button>
                  <span className="cs-detail-eye">{isToday(active) ? "Today · " : ""}{fmtDateFull(cal.dates[active - 1])}</span>
                  <button className="cs-nav-arrow" onClick={() => goDay(1)} disabled={active >= days.length} aria-label="Next day">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                </div>
                <SessionCard n={active} label={dayLabel(active)} rows={days[active - 1]} mins={dayMinutes(days[active - 1], rowMins)} isDone={isDone} toggle={toggle} expanded pinned today={isToday(active)} markAll={markAll} onToggle={() => {}} />
              </div>
            ) : null}
          </main>

          <aside className="cs-col cs-col-right reveal">
            <div className="cs-box cs-box-search">
              <div className="searchbar cs-search">
                <span className="si"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg></span>
                <input className="sinput" placeholder="Find a lecture…" value={q} onChange={(e) => setQ(e.target.value)} />
                {q && <button className="sclear" onClick={() => setQ("")} aria-label="Clear">×</button>}
              </div>
            </div>
            {days.length ? (() => {
              const pageCount = Math.ceil(days.length / CS_PAGE)
              const pg = Math.min(page, pageCount - 1)
              const start = pg * CS_PAGE
              const slice = days.slice(start, start + CS_PAGE)
              return (
                <div className="cs-window">
                  <div className="cs-window-h">Study plan · {days.length} days</div>
                  <div className="cs-window-scroll">
                    <div className="cs-cellgrid">
                      {slice.map((rs, i) => {
                        const n = start + i + 1
                        const d = rs.filter((r) => isDone(r.id)).length, tot = rs.length
                        const p = tot ? Math.round((d / tot) * 100) : 0
                        const cls = "cs-cell" + (d === tot ? " complete" : "") + (isToday(n) ? " cs-today" : "") + (n === active ? " sel" : "")
                        return (
                          <button key={n} className={cls} style={{ animationDelay: `${Math.min(i * 8, 200)}ms` }} onClick={() => setSelDay(n)} aria-label={`${dayLabel(n)}${isToday(n) ? ', today' : ''}`}>
                            {d === tot ? <span className="cs-cell-check"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span> : <SmallRing pct={p} size={28} stroke={3} showValue={false} />}
                            <span className="cs-cell-n">{dayLabel(n)}</span>
                            <span className="cs-cell-m">{fmtDuration(dayMinutes(rs, rowMins))}</span>
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
              )
            })() : null}
          </aside>
        </div>
      )}
    </div>
  )
}
