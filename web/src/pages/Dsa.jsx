import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { IconBack, FlameFire, PlatformLogo, CONTEST_PLATFORMS } from '../components/icons.jsx'
import { EmptyState, Segmented, SmallRing, Dropdown, Donut } from '../components/ui.jsx'
import { useStore, getStore, setStore } from '../lib/store.js'
import { useCloud } from '../lib/clouddb.js'
import { supabase } from '../lib/supabase.js'
import { parseSlug, fetchMeta, titleFromSlug, canonicalUrl } from '../lib/leetcode.js'
import { parseDsaCsv, mergeDrafts } from '../lib/dsacsv.js'
import { countdown, googleCalUrl, downloadIcs, REMIND_OPTIONS } from '../lib/reminders.js'

const DIFF = [{ value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }]
const diffTone = (d) => (d === 'Hard' ? 'hard' : d === 'Easy' ? 'easy' : 'med')
const DIFFC = { Easy: '#00b8a3', Medium: '#ffc01e', Hard: '#ff375f' }

const dsaToRow = (x) => ({
  id: x.id, slug: x.slug || null, title: x.title || null, url: x.url || null,
  difficulty: x.difficulty || null, topics: Array.isArray(x.topics) ? x.topics : [],
  notes: x.notes || '', status: x.status || 'todo', score: x.score == null ? null : x.score,
  target_date: x.target_date || null, source: x.source || 'manual', plan: x.plan || 'My problems',
  created_at: x.created_at || new Date().toISOString(), updated_at: x.updated_at || new Date().toISOString(),
  solved_at: x.solved_at || null,
})
const dsaFromRow = (r) => ({ ...r, topics: Array.isArray(r.topics) ? r.topics : [] })
const remToRow = (x) => ({
  id: x.id, platform: x.platform || null, name: x.name || null, starts_at: x.starts_at || null,
  remind_before_mins: x.remind_before_mins == null ? 60 : x.remind_before_mins,
  notified: !!x.notified, created_at: x.created_at || new Date().toISOString(),
})

const TrashIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" /></svg>
const ExcelPlusIcon = ({ size = 44 }) => (
  <svg viewBox="0 0 64 46" width={size} height={Math.round(size * 46 / 64)} fill="none" aria-hidden="true">
    <rect x="4" y="5" width="49" height="36" rx="4.5" fill="#14141a" stroke="#3c3c3c" strokeWidth="2" />
    <path d="M4 13V9.5A4.5 4.5 0 0 1 8.5 5H48.5A4.5 4.5 0 0 1 53 9.5V13Z" fill="#26262d" />
    <path d="M17 5v36M29 5v36M41 13v28" stroke="#34343b" strokeWidth="1.3" />
    <path d="M4 22h49M4 31h49" stroke="#34343b" strokeWidth="1.3" />
    <circle cx="48" cy="36" r="10.5" fill="#ececec" stroke="#0b0b0f" strokeWidth="2.4" />
    <path d="M48 31v10M43 36h10" stroke="#0b0b0f" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
)

function ConcentricRings({ rings, size = 132, center }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = requestAnimationFrame(() => setM(true)); return () => cancelAnimationFrame(t) }, [])
  const sw = 9, gap = 6, pad = 8
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
const DSA_RANGES = [{ k: 14, label: '2W' }, { k: 42, label: '6W' }, { k: 84, label: '12W' }]

function DsaConsistency({ items }) {
  const [ri, setRi] = useState(1)
  const swipeX = useRef(0)
  const range = DSA_RANGES[ri]
  const { series, activeDays } = useMemo(() => {
    const now = new Date(); const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const map = {}
    items.forEach((x) => { if (x.status === 'solved' && x.solved_at) { const k = String(x.solved_at).slice(0, 10); map[k] = (map[k] || 0) + 1 } })
    const arr = []
    for (let i = range.k - 1; i >= 0; i--) { const k = new Date(base - i * 86400000).toISOString().slice(0, 10); arr.push(map[k] || 0) }
    const N = 14, size = Math.max(1, Math.ceil(arr.length / N)), series = []
    for (let i = 0; i < arr.length; i += size) series.push(arr.slice(i, i + size).reduce((a, c) => a + c, 0))
    return { series, activeDays: arr.filter((c) => c > 0).length }
  }, [ri, items])
  const W = 300, H = 100, pad = 8
  const max = Math.max(1, ...series)
  const pts = series.map((v, i) => [pad + i * ((W - 2 * pad) / Math.max(1, series.length - 1)), H - 9 - (v / max) * (H - 24)])
  const line = smoothPath(pts)
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z` : ''
  const tip = pts[pts.length - 1] || [0, 0]
  const move = (dir) => setRi((v) => Math.min(DSA_RANGES.length - 1, Math.max(0, v + dir)))
  return (
    <div className="cs-box cs-box-viz"
      onTouchStart={(e) => { swipeX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - swipeX.current; if (Math.abs(dx) > 45) move(dx < 0 ? 1 : -1) }}>
      <div className="cs-viz-headrow">
        <span className="cs-panel-eye">Solved over time</span>
        <div className="cs-viz-ranges" role="tablist">
          {DSA_RANGES.map((r, i) => <button key={r.k} className={'cs-range' + (i === ri ? ' on' : '')} onClick={() => setRi(i)} aria-selected={i === ri}>{r.label}</button>)}
        </div>
      </div>
      <div className="cs-viz-stat">{activeDays} <em>active {activeDays === 1 ? 'day' : 'days'} · last {range.label}</em></div>
      <svg className="cs-line" viewBox={`0 0 ${W} ${H}`} width="100%" height="100" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="dsaline-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0.16" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></linearGradient></defs>
        {area ? <path d={area} fill="url(#dsaline-a)" /> : null}
        {line ? <path d={line} fill="none" stroke="#cfcfcf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.3" fill="#7a7a7a" />)}
        {pts.length ? <circle cx={tip[0]} cy={tip[1]} r="4" fill="#fafafa" /> : null}
      </svg>
    </div>
  )
}

function CountUp({ value, reduce }) {
  const [disp, setDisp] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    if (reduce) { setDisp(value); prev.current = value; return }
    const from = prev.current, to = value
    prev.current = value
    if (from === to) { setDisp(to); return }
    let raf, start
    const tick = (t) => { if (!start) start = t; const p = Math.min(1, (t - start) / 480); setDisp(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduce])
  return <>{disp}</>
}

function Stars({ value, onChange, readOnly }) {
  return (
    <div className={readOnly ? 'stars ro' : 'stars'} role={readOnly ? undefined : 'radiogroup'} aria-label="Score out of 5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={readOnly} className={i <= value ? 'star on' : 'star'} aria-label={`${i} out of 5`} onClick={() => onChange && onChange(i)}>
          <svg viewBox="0 0 24 24" width="17" height="17"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 18.9 6.1 21.2l1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
        </button>
      ))}
    </div>
  )
}

const pad2 = (n) => String(n).padStart(2, '0')
const fmtDate = (iso) => (iso ? new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '')
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
const emptyForm = { url: '', slug: '', title: '', difficulty: 'Medium', topicsText: '', notes: '', status: 'todo', score: 4 }

const _mk = (o, dayAgo) => ({
  id: o.id, slug: o.slug, title: o.title, url: canonicalUrl(o.slug),
  difficulty: o.diff, topics: o.topics, notes: o.notes || '',
  status: o.status, score: o.status === 'solved' ? o.score : null,
  target_date: o.target || null, source: 'sample', plan: o.plan || 'My problems',
  created_at: new Date(Date.now() - (dayAgo + 3) * 86400000).toISOString(),
  updated_at: new Date(Date.now() - dayAgo * 86400000).toISOString(),
  solved_at: o.status === 'solved' ? new Date(Date.now() - dayAgo * 86400000).toISOString() : null,
})
const SAMPLE_DSA = [
  _mk({ id: 'seed-1', slug: 'two-sum', title: 'Two Sum', diff: 'Easy', topics: ['Array', 'Hash Table'], status: 'solved', score: 5, notes: 'Hash map, one pass — O(n).' }, 0),
  _mk({ id: 'seed-2', slug: 'valid-parentheses', title: 'Valid Parentheses', diff: 'Easy', topics: ['String', 'Stack'], status: 'solved', score: 4, notes: 'Stack of opening brackets.' }, 1),
  _mk({ id: 'seed-3', slug: 'merge-two-sorted-lists', title: 'Merge Two Sorted Lists', diff: 'Easy', topics: ['Linked List', 'Recursion'], status: 'solved', score: 4 }, 2),
  _mk({ id: 'seed-4', slug: 'best-time-to-buy-and-sell-stock', title: 'Best Time to Buy and Sell Stock', diff: 'Easy', topics: ['Array', 'Dynamic Programming'], status: 'todo' }, 3),
  _mk({ id: 'seed-5', slug: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating Characters', diff: 'Medium', topics: ['Hash Table', 'String', 'Sliding Window'], status: 'solved', score: 3, notes: 'Sliding window + last-seen map.' }, 4),
  _mk({ id: 'seed-6', slug: '3sum', title: '3Sum', diff: 'Medium', topics: ['Array', 'Two Pointers', 'Sorting'], status: 'todo', target: '2026-08-05' }, 4),
  _mk({ id: 'seed-7', slug: 'group-anagrams', title: 'Group Anagrams', diff: 'Medium', topics: ['Hash Table', 'String', 'Sorting'], status: 'todo' }, 5),
  _mk({ id: 'seed-8', slug: 'course-schedule', plan: 'Grind 75', title: 'Course Schedule', diff: 'Medium', topics: ['Graph', 'DFS', 'Topological Sort'], status: 'todo', target: '2026-08-08' }, 6),
  _mk({ id: 'seed-9', slug: 'lru-cache', title: 'LRU Cache', diff: 'Medium', topics: ['Hash Table', 'Linked List', 'Design'], status: 'solved', score: 2, notes: 'Revisit — fumbled the doubly linked list.' }, 7),
  _mk({ id: 'seed-10', slug: 'number-of-islands', plan: 'Grind 75', title: 'Number of Islands', diff: 'Medium', topics: ['Graph', 'BFS', 'DFS'], status: 'todo' }, 8),
  _mk({ id: 'seed-11', slug: 'trapping-rain-water', plan: 'Grind 75', title: 'Trapping Rain Water', diff: 'Hard', topics: ['Array', 'Two Pointers', 'Dynamic Programming'], status: 'todo', target: '2026-08-12' }, 9),
  _mk({ id: 'seed-12', slug: 'median-of-two-sorted-arrays', plan: 'Grind 75', title: 'Median of Two Sorted Arrays', diff: 'Hard', topics: ['Array', 'Binary Search'], status: 'todo' }, 10),
  _mk({ id: 'seed-13', slug: 'word-ladder', plan: 'Grind 75', title: 'Word Ladder', diff: 'Hard', topics: ['Graph', 'BFS'], status: 'todo' }, 11),
]

const DTP_DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const nowLocal = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}` } // eslint-disable-line
function DateTimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const parsed = value ? new Date(value) : null
  const initH = parsed ? parsed.getHours() : 20
  const [ym, setYm] = useState(() => { const d = parsed || new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const [sel, setSel] = useState(parsed ? { y: parsed.getFullYear(), m: parsed.getMonth(), d: parsed.getDate() } : null)
  const [hour, setHour] = useState(((initH + 11) % 12) + 1)
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0)
  const [ampm, setAmpm] = useState(initH >= 12 ? 'PM' : 'AM')
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  const emit = (s, h, mi, ap) => {
    if (!s) return
    const h24 = ap === 'PM' ? (h % 12) + 12 : (h % 12)
    onChange(`${s.y}-${pad2(s.m + 1)}-${pad2(s.d)}T${pad2(h24)}:${pad2(mi)}`)
  }
  const pickDay = (d) => { const s = { y: ym.y, m: ym.m, d }; setSel(s); emit(s, hour, minute, ampm) }
  const bumpHour = (dir) => { const h = ((hour - 1 + dir + 12) % 12) + 1; setHour(h); emit(sel, h, minute, ampm) }
  const bumpMin = (dir) => { const mi = (minute + dir * 5 + 60) % 60; setMinute(mi); emit(sel, hour, mi, ampm) }
  const setAP = (ap) => { setAmpm(ap); emit(sel, hour, minute, ap) }
  const nav = (delta) => setYm((pp) => { let m = pp.m + delta, y = pp.y; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } return { y, m } })
  const first = new Date(ym.y, ym.m, 1)
  const startDow = first.getDay()
  const dim = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)
  const isToday = (d) => { const t = new Date(); return t.getFullYear() === ym.y && t.getMonth() === ym.m && t.getDate() === d }
  const label = value ? `${new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : 'Pick date & time'
  return (
    <div className="dtp" ref={ref}>
      <button type="button" className={'dtp-field' + (value ? ' set' : '')} onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
        <span>{label}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 9h16M8 3v4M16 3v4" /></svg>
      </button>
      {open && (
        <div className="dtp-pop" role="dialog" aria-label="Pick date and time">
          <div className="dtp-cal">
            <div className="home-cal-head">
              <button type="button" className="cg-cal-nav" onClick={() => nav(-1)} aria-label="Previous month">‹</button>
              <span className="home-cal-title">{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <button type="button" className="cg-cal-nav" onClick={() => nav(1)} aria-label="Next month">›</button>
            </div>
            <div className="home-cal-grid">
              {DTP_DOW.map((d, i) => <span key={'h' + i} className="home-cal-dow">{d}</span>)}
              {cells.map((d, i) => d == null ? <span key={i} /> : (
                <button type="button" key={i} className={'home-cal-day' + (sel && sel.y === ym.y && sel.m === ym.m && sel.d === d ? ' sel' : '') + (isToday(d) ? ' today' : '')} onClick={() => pickDay(d)}>{d}</button>
              ))}
            </div>
          </div>
          <div className="dtp-clock">
            <div className="cs-panel-eye">Time</div>
            <div className="dtp-time">
              <div className="dtp-unit">
                <button type="button" onClick={() => bumpHour(1)} aria-label="Hour up">▲</button>
                <b>{pad2(hour)}</b>
                <button type="button" onClick={() => bumpHour(-1)} aria-label="Hour down">▼</button>
              </div>
              <span className="dtp-colon">:</span>
              <div className="dtp-unit">
                <button type="button" onClick={() => bumpMin(1)} aria-label="Minute up">▲</button>
                <b>{pad2(minute)}</b>
                <button type="button" onClick={() => bumpMin(-1)} aria-label="Minute down">▼</button>
              </div>
            </div>
            <div className="dtp-ampm"><Segmented value={ampm} onChange={setAP} options={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]} /></div>
            <button type="button" className="rbtn sm dtp-done" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dsa() {
  const reduce = useReducedMotion()
  const nav = useNavigate()
  const problems = useCloud('dsa_problems', { localKey: 'col:dsa', toRow: dsaToRow, fromRow: dsaFromRow })
  const reminders = useCloud('contest_reminders', { localKey: 'col:contests', toRow: remToRow })
  const items = problems.items
  const [goal, setGoal] = useStore('dsa:weekgoal', 5)

  const migrated = useRef(false)
  useEffect(() => {
    if (migrated.current || !items) return
    const needP = items.some((x) => !x.status || x.slug === undefined)
    const needR = reminders.items.some((x) => x.starts_at === undefined)
    if (!needP && !needR) { migrated.current = true; return }
    migrated.current = true
    const now = new Date().toISOString()
    if (needP) {
      const fixed = items.map((x) => {
        if (x.status && x.slug !== undefined) return x
        const slug = x.slug !== undefined ? x.slug : (parseSlug(x.url || x.link || '') || '')
        const status = x.status || 'solved'
        return {
          ...x, slug, url: x.url || x.link || (slug ? canonicalUrl(slug) : ''),
          title: x.title || (slug ? titleFromSlug(slug) : 'Problem'),
          topics: Array.isArray(x.topics) ? x.topics : [], status,
          score: x.score != null ? x.score : (status === 'todo' ? null : 4), source: x.source || 'manual',
          target_date: x.target_date || null,
          created_at: x.created_at || (x.created ? new Date(x.created).toISOString() : now),
          updated_at: x.updated_at || now,
          solved_at: x.solved_at || (x.date ? x.date + 'T12:00:00.000Z' : status !== 'todo' ? now : null),
        }
      })
      problems.setItems(fixed)
      problems.upsertMany(fixed.filter((x) => x.slug))
    }
    if (needR) {
      const rfx = reminders.items.map((x) => x.starts_at !== undefined ? x : ({ ...x, starts_at: x.date ? x.date + 'T00:00:00.000Z' : null, remind_before_mins: 60, notified: false }))
      reminders.setItems(rfx)
      reminders.upsertMany(rfx)
    }
  }, [items, reminders.items]) // eslint-disable-line

  useEffect(() => {
    if (getStore('dsa:seeded', false)) return
    const t = setTimeout(() => {
      if ((getStore('col:dsa', []) || []).length === 0) { setStore('dsa:seeded', true); problems.setItems(SAMPLE_DSA) }
      else setStore('dsa:seeded', true)
    }, 900)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line

  const [form, setForm] = useState(emptyForm)
  const [fetching, setFetching] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)
  const [addOpen, setAddOpen] = useState(true)
  const [toast, setToast] = useState('')
  const [confirmPlan, setConfirmPlan] = useState(null)
  const say = (m) => { setToast(m); clearTimeout(say._t); say._t = setTimeout(() => setToast(''), 2200) }
  const formTopics = useMemo(() => form.topicsText.split(/[;,]/).map((t) => t.trim()).filter(Boolean), [form.topicsText])
  const removeFormTopic = (t) => setForm((f) => ({ ...f, topicsText: formTopics.filter((x) => x !== t).join('; ') }))

  const doFetch = async () => {
    const slug = parseSlug(form.url)
    if (!slug) { say('Paste a LeetCode problem link'); return }
    setFetching(true)
    const meta = await fetchMeta(slug)
    setFetching(false)
    setForm((f) => ({ ...f, slug: meta.slug, url: canonicalUrl(meta.slug), title: meta.title || f.title, difficulty: meta.difficulty || f.difficulty, topicsText: meta.topics.length ? meta.topics.join('; ') : f.topicsText }))
    setAutoFilled(!meta.offline)
    say(meta.offline ? 'Backend offline — filled from the link' : 'Fetched from LeetCode')
  }

  const saveProblem = () => {
    const slug = form.slug || parseSlug(form.url)
    const title = form.title.trim() || (slug ? titleFromSlug(slug) : '')
    if (!title) { say('Add a title or a LeetCode link'); return }
    const now = new Date().toISOString()
    const base = {
      slug: slug || null, url: form.url || (slug ? canonicalUrl(slug) : ''), title,
      difficulty: form.difficulty, topics: formTopics, notes: form.notes, status: form.status,
      score: form.status === 'solved' ? Number(form.score) : null, source: 'manual', plan: 'My problems',
      updated_at: now, solved_at: form.status === 'solved' ? now : null, target_date: null,
    }
    const dupe = slug ? items.find((x) => x.slug === slug && (x.plan || 'My problems') === 'My problems') : null
    if (dupe) { problems.update(dupe.id, base); say('Updated existing problem') }
    else { problems.add({ ...base, created_at: now }); say('Saved to “My problems”') }
    setForm(emptyForm); setAutoFilled(false)
  }

  const stats = useMemo(() => {
    const solved = items.filter((x) => x.status === 'solved')
    const total = items.length
    const dates = new Set(solved.map((x) => (x.solved_at || x.created_at || '').slice(0, 10)).filter(Boolean))
    const back = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
    let streak = 0, k = dates.has(back(0)) ? 0 : 1
    while (dates.has(back(k))) { streak++; k++ }
    const wk = Date.now() - 6 * 86400000
    const week = solved.filter((x) => new Date(x.solved_at || x.created_at || 0).getTime() >= wk).length
    const review = solved.filter((x) => (x.score || 0) <= 2).length
    const avg = solved.length ? Math.round(solved.reduce((a, b) => a + (b.score || 0), 0) / solved.length * 10) / 10 : 0
    return { total, solved: solved.length, todo: total - solved.length, streak, week, review, avg }
  }, [items])

  const byDiff = useMemo(() => {
    const g = { Easy: { t: 0, s: 0 }, Medium: { t: 0, s: 0 }, Hard: { t: 0, s: 0 } }
    items.forEach((x) => { if (g[x.difficulty]) { g[x.difficulty].t++; if (x.status === 'solved') g[x.difficulty].s++ } })
    return g
  }, [items])
  const dPct = (d) => (byDiff[d].t ? Math.round(byDiff[d].s / byDiff[d].t * 100) : 0)
  const diffRings = [{ pct: dPct('Hard'), color: DIFFC.Hard }, { pct: dPct('Medium'), color: DIFFC.Medium }, { pct: dPct('Easy'), color: DIFFC.Easy }]

  const planList = useMemo(() => {
    const m = {}
    items.forEach((x) => {
      const pl = x.plan || 'My problems'
      if (!m[pl]) m[pl] = { plan: pl, total: 0, solved: 0 }
      m[pl].total++
      if (x.status === 'solved') m[pl].solved++
    })
    return Object.values(m).sort((a, b) => a.plan.localeCompare(b.plan))
  }, [items])

  const removePlan = (plan) => {
    const ids = items.filter((x) => (x.plan || 'My problems') === plan).map((x) => x.id)
    ids.forEach((id) => problems.remove(id))
    setConfirmPlan(null)
    say(`Deleted plan “${plan}” · ${ids.length} problem${ids.length === 1 ? '' : 's'}`)
  }

  const [csvPlan, setCsvPlan] = useState('')
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const planName = csvPlan.trim() || f.name.replace(/\.csv$/i, '').trim() || 'Imported plan'
    const reader = new FileReader()
    reader.onload = () => {
      const { drafts, skipped } = parseDsaCsv(String(reader.result || ''))
      const { changed, added, updated } = mergeDrafts(items, drafts, planName)
      setPreview({ added, updated, skipped, changed, plan: planName })
      if (!changed.length) say(skipped ? `Nothing to import (${skipped} rows skipped)` : 'Nothing new to import')
    }
    reader.readAsText(f)
    e.target.value = ''
  }
  const confirmImport = () => {
    if (preview && preview.changed.length) { problems.upsertMany(preview.changed); const pl = preview.plan; say(`Imported ${preview.added} new · ${preview.updated} updated → “${pl}”`); setTimeout(() => nav(`/dsa/plan/${encodeURIComponent(pl)}`), 350) }
    setPreview(null); setCsvPlan('')
  }
  const exportCsv = () => {
    const header = 'url,difficulty,topic,date,status,notes,plan'
    const rows = items.map((x) => [x.url || '', x.difficulty || '', (x.topics || []).join('; '), x.target_date || '', x.status || 'todo', x.notes || '', x.plan || 'My problems'].map(csvCell).join(','))
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'dsa-problems.csv'; document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    say(`Exported ${items.length} problems`)
  }

  const [rf, setRf] = useState({ platform: 'LeetCode', name: '', when: '', remind: 60 })
  const addReminder = () => {
    if (!rf.name.trim() || !rf.when) { say('Add a contest name and time'); return }
    reminders.add({ platform: rf.platform, name: rf.name.trim(), starts_at: new Date(rf.when).toISOString(), remind_before_mins: Number(rf.remind), notified: false })
    setRf({ platform: rf.platform, name: '', when: '', remind: rf.remind })
    say('Reminder set')
  }
  const [, tickState] = useState(0)
  useEffect(() => { const t = setInterval(() => tickState((n) => n + 1), 30000); return () => clearInterval(t) }, [])
  const upcoming = useMemo(() => [...reminders.items].filter((r) => r.starts_at).sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at))), [reminders.items])

  const pct = stats.total ? Math.round((stats.solved / stats.total) * 100) : 0
  const goalPct = goal ? Math.min(100, Math.round(stats.week / goal * 100)) : 0

  return (
    <div className="cs-wrap dsa-wrap">
      <div className="pagehead reveal">
        <Link to="/" className="back" aria-label="Back to home"><IconBack /></Link>
        <div className="htx"><div className="eye">Daily practice · plans</div><h1>DSA</h1></div>
      </div>

      <section className="cs-box dsa-kpistrip reveal">
        <div className="dsa-kpi"><span className={'dsa-kpi-v ' + (stats.streak > 0 ? 'good' : '')}>{stats.streak > 0 ? <FlameFire size={15} /> : null}<CountUp value={stats.streak} reduce={reduce} /><i>d</i></span><span className="dsa-kpi-l">Streak</span></div>
        <div className="dsa-kpi"><span className="dsa-kpi-v"><CountUp value={stats.solved} reduce={reduce} /></span><span className="dsa-kpi-l">Solved</span></div>
        <div className="dsa-kpi"><span className="dsa-kpi-v"><CountUp value={stats.todo} reduce={reduce} /></span><span className="dsa-kpi-l">To-do</span></div>
        <div className="dsa-kpi"><span className="dsa-kpi-v"><CountUp value={stats.week} reduce={reduce} /></span><span className="dsa-kpi-l">This week</span></div>
        <div className="dsa-kpi"><span className="dsa-kpi-v">{stats.solved ? stats.avg : '—'}</span><span className="dsa-kpi-l">Avg score</span></div>
      </section>

      <div className="cs-grid3 dsa-grid">
        {/* LEFT — trackers & visualizations */}
        <aside className="cs-col cs-col-left reveal">
          <div className="cs-box cs-box-plan dsa-practice">
            <div className="cs-panel-eye">Your practice</div>
            <Donut
              size={132} stroke={16}
              centerValue={stats.solved} centerLabel="solved"
              segments={['Easy', 'Medium', 'Hard'].map((d) => ({ label: d, value: byDiff[d].s, color: DIFFC[d] }))}
            />
            <div className="dsa-diffcounts">
              {['Easy', 'Medium', 'Hard'].map((d) => (
                <div className="dsa-dc" key={d}>
                  <span className="dsa-dc-dot" style={{ background: DIFFC[d] }} />
                  <span className="dsa-dc-n">{d}</span>
                  <b className="dsa-dc-v">{byDiff[d].s}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="cs-box dsa-goalbox">
            <div className="cs-panel-eye">Weekly goal</div>
            <div className="dsa-goal-body">
              <SmallRing pct={goalPct} size={66} stroke={7} />
              <div className="dsa-goal-info">
                <div className="cs-head-day">{stats.week} <span>/ {goal}</span></div>
                <div className="cs-head-sub">solved this week</div>
                <div className="dsa-stepper">
                  <button onClick={() => setGoal((g) => Math.max(1, g - 1))} aria-label="Decrease weekly goal">−</button>
                  <span>{goal} / week</span>
                  <button onClick={() => setGoal((g) => Math.min(50, g + 1))} aria-label="Increase weekly goal">+</button>
                </div>
              </div>
            </div>
          </div>

          <DsaConsistency items={items} />
        </aside>

        {/* CENTER — plans (import/export) + add a problem */}
        <main className="cs-col cs-col-center reveal">
          <div className="cs-box dsa-iobox">
            <div className="dsa-iobox-head">
              <button type="button" className="dsa-io-icon" onClick={() => fileRef.current && fileRef.current.click()} aria-label="Upload a CSV checklist"><ExcelPlusIcon /></button>
              <div className="dsa-io-body">
                <div className="ctitle">Plans · import / export</div>
                <div className="dsa-csv-sub">Each CSV upload becomes one named <b>plan</b>. The data is saved to your bank — the file is discarded.</div>
              </div>
            </div>
            <input className="finput dsa-plan-in" placeholder="Plan name (e.g. Blind 75)" value={csvPlan} onChange={(e) => setCsvPlan(e.target.value)} />
            <div className="dsa-csv-actions">
              <a className="dsa-ghost" href="/dsa-template.csv" download>Template</a>
              <button className="dsa-ghost" onClick={exportCsv} disabled={!items.length}>Export</button>
              <button className="rbtn sm" onClick={() => fileRef.current && fileRef.current.click()}>Upload CSV</button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
            </div>
            <AnimatePresence>
              {preview && (
                <motion.div className="csv-bar" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <span className="csv-bar-t">Plan “{preview.plan}” · {preview.added} new · {preview.updated} updated{preview.skipped ? ` · ${preview.skipped} skipped` : ''}</span>
                  <div className="csv-bar-a"><button className="dsa-ghost" onClick={() => setPreview(null)}>Cancel</button><button className="rbtn sm" onClick={confirmImport} disabled={!preview.changed.length}>Merge</button></div>
                </motion.div>
              )}
            </AnimatePresence>

            {planList.length > 0 && (
              <div className="dsa-plan-cards">
                <div className="cs-panel-eye dsa-plan-eye">Your plans · {planList.length}</div>
                {planList.map((ps) => {
                  const pc = ps.total ? Math.round(ps.solved / ps.total * 100) : 0
                  return (
                    <div key={ps.plan} className="dsa-plan-card">
                      <button className="dsa-plan-open" onClick={() => nav(`/dsa/plan/${encodeURIComponent(ps.plan)}`)} aria-label={`Open ${ps.plan}`}>
                        <div className="dsa-plan-card-h"><span className="dsa-plan-name">{ps.plan}</span><span className="dsa-plan-count">{ps.solved}/{ps.total}</span></div>
                        <div className="dsa-plan-bar"><i style={{ width: pc + '%' }} /></div>
                        <div className="dsa-plan-card-f"><span>{ps.total - ps.solved} to-do · {pc}%</span><span className="dsa-plan-go">Open →</span></div>
                      </button>
                      <button className="dsa-plan-del" onClick={() => setConfirmPlan(ps.plan)} aria-label={`Delete plan ${ps.plan}`} title="Delete plan"><TrashIcon /></button>
                      {confirmPlan === ps.plan && (
                        <div className="dsa-plan-confirm" role="alertdialog" aria-label={`Delete ${ps.plan}?`}>
                          <span className="dsa-plan-confirm-t">Delete “{ps.plan}” and its {ps.total} problem{ps.total === 1 ? '' : 's'}?</span>
                          <div className="dsa-plan-confirm-a">
                            <button className="dsa-ghost" onClick={() => setConfirmPlan(null)}>Cancel</button>
                            <button className="rbtn sm dsa-plan-confirm-del" onClick={() => removePlan(ps.plan)}>Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="cs-box">
            <button className="dsa-fold" onClick={() => setAddOpen((o) => !o)} aria-expanded={addOpen}>
              <span className="ctitle">Add a problem</span>
              <span className="dsa-status">{supabase ? 'Cloud synced' : 'Local only'} · My problems</span>
              <span className={addOpen ? 'dsa-fold-x open' : 'dsa-fold-x'}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></span>
            </button>
            {addOpen && (
              <div className="qform">
                <div className="dsa-linkrow">
                  <input className="finput" placeholder="Paste a LeetCode link — auto-fills title & topic" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && doFetch()} />
                  <button className="dsa-fetch" onClick={doFetch} disabled={fetching}>{fetching ? <span className="dsa-spin" aria-label="Fetching" /> : 'Fetch'}</button>
                </div>
                <input className="finput" placeholder="Problem title" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setAutoFilled(false) }} />
                {autoFilled && <div className="dsa-auto">Auto-filled from LeetCode — edit anything before saving</div>}
                <input className="finput" placeholder="Topics — separate with ;" value={form.topicsText} onChange={(e) => setForm({ ...form, topicsText: e.target.value })} />
                {formTopics.length > 0 && (
                  <div className="dsa-topics addchips">
                    {formTopics.map((t) => <button type="button" key={t} className="dsa-topic on" onClick={() => removeFormTopic(t)} aria-label={`Remove ${t}`}>{t} <span className="x">×</span></button>)}
                  </div>
                )}
                <div className="dsa-field"><span className="dsa-field-l">Difficulty</span><Segmented value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={DIFF} /></div>
                <textarea className="rnote" placeholder="Approach / notes…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <button className="rbtn" onClick={saveProblem}>Save problem</button>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT — contest reminders */}
        <aside className="cs-col cs-col-right reveal">
          <div className="cs-box dsa-rembox">
            <div className="ctitle">Contest reminders</div>
            <div className="plat-picker" role="group" aria-label="Platform">
              {CONTEST_PLATFORMS.map((p) => (
                <motion.button key={p} whileTap={{ scale: 0.94 }} className={'plat-btn' + (rf.platform === p ? ' on' : '')} onClick={() => setRf({ ...rf, platform: p })}><PlatformLogo platform={p} size={18} /><span>{p}</span></motion.button>
              ))}
            </div>
            <div className="rem-form">
              <input className="finput" placeholder="Contest name" value={rf.name} onChange={(e) => setRf({ ...rf, name: e.target.value })} />
              <div className="rem-field-l">Date &amp; time<DateTimePicker value={rf.when} onChange={(v) => setRf({ ...rf, when: v })} /></div>
              <div className="rem-field-l">Remind before<Dropdown value={rf.remind} onChange={(v) => setRf({ ...rf, remind: v })} options={REMIND_OPTIONS} ariaLabel="Remind before" /></div>
              <button className="rbtn sm" onClick={addReminder}>Set reminder</button>
              <div className="rem-hint">Adds a calendar alarm at your chosen lead time — and syncs for the mobile app.</div>
            </div>
            <div className="rem-list">
              {upcoming.length === 0 ? <EmptyState title="No reminders yet">Set a Codeforces / LeetCode / CodeChef contest and get a calendar alert.</EmptyState> : (
                <AnimatePresence initial={false}>
                  {upcoming.map((r) => {
                    const past = new Date(r.starts_at).getTime() < Date.now()
                    const soon = !past && new Date(r.starts_at).getTime() - Date.now() < 86400000
                    return (
                      <motion.div className={'rem-card' + (past ? ' past' : '') + (soon ? ' soon' : '')} key={r.id} layout initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                        <span className="rem-rail" aria-hidden="true" />
                        <div className="rem-top"><span className="rem-logo"><PlatformLogo platform={r.platform} size={18} /></span><span className="rem-name">{r.name}</span><button className="dsa-iconbtn danger" onClick={() => reminders.remove(r.id)} aria-label={`Remove ${r.name}`} title="Remove"><TrashIcon /></button></div>
                        <div className="rem-mid"><span className="rem-when">{fmtDate(r.starts_at)} · {fmtTime(r.starts_at)}</span><span className={'rem-count' + (soon ? ' soon' : '')}>{countdown(r.starts_at)}</span></div>
                        <div className="rem-foot"><span className="rem-remind">Remind {REMIND_OPTIONS.find((o) => o.v === r.remind_before_mins)?.l.replace(' before', '') || `${r.remind_before_mins}m`} before</span><span className="dsa-spacer" /><a className="rem-cal" href={googleCalUrl(r)} target="_blank" rel="noreferrer" title="Add to Google Calendar">＋ Calendar</a><button className="rem-cal" onClick={() => downloadIcs(r)} title="Download .ics">.ics</button></div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {toast && <motion.div className="dsa-toast" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}>{toast}</motion.div>}
      </AnimatePresence>
    </div>
  )
}
