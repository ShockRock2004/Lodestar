import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card.jsx'
import Reveal from '../components/Reveal.jsx'
import Modal from '../components/Modal.jsx'
import CalendarCard from '../components/CalendarCard.jsx'
import { useReading, useCollection, activityRange, entriesForDate, readingStats, activitySectionLevels } from '../lib/progress.js'
import { getStore, useStore, todayISO } from '../lib/store.js'
import { IconChevron, IconDsa, IconSys, IconCs, IconMl, IconOdin, IconLld, IconChecklist } from '../components/icons.jsx'
import { scheduleInfo, fmtDate } from '../lib/schedule.js'
import { LLD_TOTAL_DAYS } from '../lib/lld.js'
import SwipeDeck from '../components/SwipeDeck.jsx'
import AiPanel from '../components/AiPanel.jsx'
import { CHECKLIST_KEY, checklistSummary, urgentFeed } from '../lib/checklists.js'
import { fmtRange, timeState, nowMins } from '../lib/timephrase.js'

const H = new Date().getHours()
const GREET = H < 12 ? 'Good morning' : H < 18 ? 'Good afternoon' : 'Good evening'
const DATESTR = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

/* ---------- reusable primitives ---------- */
function Ring({ pct, size = 46, stroke = 4, children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c - c * (Math.max(0, Math.min(100, pct)) / 100)
  return (
    <div className="relative grid flex-none place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringmono)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span className="absolute grid place-items-center">{children}</span>
    </div>
  )
}

function Check({ done, onClick, label, size = 20 }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={done}
      className={'grid flex-none place-items-center rounded-full border transition-colors ' + (done ? 'border-[#e6e6e6] bg-[#e6e6e6]' : 'border-[#474747] hover:border-white/60')}
      style={{ width: size, height: size }}>
      {done && <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24"><path d="M6 12l4 4 8-8" fill="none" stroke="#0b0b0b" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  )
}

function AgendaRow({ done, label, meta, onToggle }) {
  return (
    <div className="flex items-center gap-2.5 py-[7px]">
      <Check done={done} onClick={onToggle} label={`Complete ${label}`} size={18} />
      <span className={'flex-1 truncate text-[12.5px] ' + (done ? 'text-[#5c5c5c] line-through' : 'text-[#d4d4d4]')}>
        {label}{meta ? <span className="text-[#5f5f5f]"> · {meta}</span> : null}
      </span>
    </div>
  )
}

function ActionButton({ to, onClick, children }) {
  const cls = 'inline-flex flex-none items-center gap-1 rounded-lg border border-[#2a2a2a] bg-white/[0.02] px-3 py-1.5 text-[12.5px] font-semibold text-[#e6e6e6] transition-colors hover:border-[#3a3a3a] hover:bg-white/[0.05] [&>svg]:h-3.5 [&>svg]:w-3.5'
  return to ? <Link to={to} className={cls}>{children}</Link> : <button onClick={onClick} className={cls}>{children}</button>
}

function Pace({ late, pace }) {
  if (!pace) return null
  if (late) return <span className="text-[11.5px] font-semibold text-[#ff5252]">{pace}</span>
  if (pace === 'On track') return <span className="text-[11.5px] font-semibold text-[#ff7d29]">On track</span>
  return <span className="text-[11.5px] text-[#6a6a6a]">{pace}</span>
}

const doneToday = (r) => Object.entries(r.done).filter(([, ts]) => String(ts).slice(0, 10) === todayISO()).map(([n]) => +n)
const toggleToday = (r) => {
  const t = doneToday(r)
  if (t.length) { r.toggle(Math.max(...t)); return }   // undo today's completion
  if (r.finished) return                                // already 100% and nothing done today — never toggle a past day off
  r.toggle(r.currentDay)                                // mark today's day done
}
const dayOf = (r) => r.plan.days[r.currentDay - 1]
function globalStreak() {
  const range = activityRange(120)
  let s = 0, i = range.length - 1
  if (range[i] && range[i].count === 0) i--
  for (; i >= 0 && range[i] && range[i].count > 0; i--) s++
  return s
}

/* ---------- single source of truth for the day ---------- */
function useToday() {
  const sd = useReading('system-design')
  const ma = useReading('math')
  const ho = useReading('handson')
  const dsa = useCollection('dsa')
  const cs = getStore('cs:stats', { done: 0, total: 46, pct: 0 })
  const odin = getStore('odin:stats', { done: 0, total: 197, pct: 0 })
  const lld = getStore('lld:stats', { done: 0, total: 0, pct: 0, doneDays: 0 })
  const lldBehind = Math.max(0, scheduleInfo('lld', LLD_TOTAL_DAYS).due - (lld.doneDays || 0))

  const dsaToday = dsa.items.find((x) => x.date === todayISO())
  const readDone = (r) => doneToday(r).length > 0 || r.finished

  const tracks = [
    {
      key: 'sd', name: 'System Design', Icon: IconSys, pct: sd.pct, to: '/system-design',
      state: `Day ${sd.currentDay} of ${sd.total}`, late: sd.behind > 0, pace: sd.behind ? `${sd.behind}d behind` : 'On track',
      items: [{ label: 'Today’s reading', meta: sd.finished ? 'complete' : `pp. ${dayOf(sd).from}–${dayOf(sd).to}`, done: readDone(sd), toggle: () => toggleToday(sd) }],
    },
    {
      key: 'ml', name: 'ML · Quant', Icon: IconMl, pct: Math.round((ma.pct + ho.pct) / 2), to: '/ml-quant',
      state: `Math d${ma.currentDay} · Hands-On d${ho.currentDay}`, late: Math.max(ma.behind, ho.behind) > 0,
      pace: Math.max(ma.behind, ho.behind) ? `${Math.max(ma.behind, ho.behind)}d behind` : 'On track',
      items: [
        { label: 'Math for ML', meta: ma.finished ? 'complete' : `pp. ${dayOf(ma).from}–${dayOf(ma).to}`, done: readDone(ma), toggle: () => toggleToday(ma) },
        { label: 'Hands-On ML', meta: ho.finished ? 'complete' : `pp. ${dayOf(ho).from}–${dayOf(ho).to}`, done: readDone(ho), toggle: () => toggleToday(ho) },
      ],
    },
    {
      key: 'cs', name: 'CS Core', Icon: IconCs, pct: cs.pct, to: '/cs-core',
      state: `${cs.done} of ${cs.total || 46} topics`, late: false, pace: 'Self-paced',
      objective: 'OS · Computer Networks · DBMS', items: [],
    },
    {
      key: 'dsa', name: 'DSA', Icon: IconDsa, pct: null, to: '/dsa',
      state: 'Daily practice', late: false, pace: 'Daily',
      objective: dsaToday ? `${dsaToday.title} · ${dsaToday.score}/5` : 'Log today’s LeetCode problem',
      dsaToday, dsa,
      items: [{ label: 'Today’s problem', meta: dsaToday ? `${dsaToday.score}/5` : 'not logged', done: !!dsaToday, toggle: null }],
    },
    {
      key: 'odin', name: 'Full Stack', Icon: IconOdin, pct: odin.pct, to: '/full-stack',
      state: `${odin.done} of ${odin.total} items`, late: false, pace: '4-month plan',
      objective: 'Foundations → JS → React → NodeJS', items: [],
    },
    {
      key: 'lld', name: 'Low Level Design', Icon: IconLld, pct: lld.pct, to: '/lld',
      state: `${lld.doneDays || 0} of ${LLD_TOTAL_DAYS} days`, late: lldBehind > 0,
      pace: lldBehind ? `${lldBehind}d behind` : 'On track',
      objective: 'OOP · patterns · 33 problems', items: [],
    },
  ]

  const allItems = tracks.flatMap((t) => t.items)
  const done = allItems.filter((i) => i.done).length
  const total = allItems.length

  const cand = [
    { name: 'System Design', to: '/system-design', behind: sd.behind, done: readDone(sd), obj: sd.finished ? 'Plan complete' : `${fmtDate(scheduleInfo('system-design', sd.total).dates[Math.min(sd.currentDay, sd.total) - 1])} · pp. ${dayOf(sd).from}–${dayOf(sd).to}` },
    { name: 'Hands-On ML', to: '/ml-quant', behind: ho.behind, done: readDone(ho), obj: ho.finished ? 'Plan complete' : `Day ${ho.currentDay} · pp. ${dayOf(ho).from}–${dayOf(ho).to}` },
    { name: 'Math for ML', to: '/ml-quant', behind: ma.behind, done: readDone(ma), obj: ma.finished ? 'Plan complete' : `Day ${ma.currentDay} · pp. ${dayOf(ma).from}–${dayOf(ma).to}` },
    { name: 'DSA', to: '/dsa', behind: 0, done: !!dsaToday, obj: 'Log today’s LeetCode problem' },
  ]
  const resume = cand.filter((x) => !x.done).sort((a, b) => b.behind - a.behind)[0] || null

  const ORDER = ['dsa', 'ml', 'cs', 'sd', 'odin', 'lld']
  tracks.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key))
  const pcts = tracks.map((t) => t.pct).filter((p) => p != null)
  const overall = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0
  return { tracks, completion: { done, total }, resume, streak: globalStreak(), overall }
}

/* ---------- header ---------- */
function TopBar({ resume, streak, completion, overall }) {
  const behind = resume && resume.behind > 0
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[13px] text-[#737373]">{DATESTR}</div>
        <h1 className="cg-chrome mt-1 text-[27px] font-bold tracking-tight">{GREET}</h1>
        <div className="mt-1.5 text-[13.5px] text-[#a1a1a1]">
          {!resume ? <>You’ve <span className="font-medium text-white">cleared today</span>. Keep the streak alive.</>
            : behind ? <>You’re <span className="font-medium text-[#ff5252]">{resume.behind} {resume.behind === 1 ? 'day' : 'days'} behind</span> on {resume.name}. Start there.</>
              : <>You’re <span className="font-medium text-[#ff7d29]">on track</span>. {completion.total - completion.done} left to finish today.</>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden flex-col items-end sm:flex">
          <span className="text-[19px] font-bold tracking-tight text-white">{overall}%</span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-[#6a6a6a]">overall</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Ring pct={(completion.done / completion.total) * 100} size={52} stroke={4}>
            <span className="text-[12px] font-bold text-white">{completion.done}/{completion.total}</span>
          </Ring>
          <span className="text-[10px] uppercase tracking-[0.12em] text-[#6a6a6a]">today</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- resume band (primary hero) ---------- */
function ResumeBand({ resume }) {
  if (!resume) {
    return (
      <Card variant="soft" className="cg-w flex items-center justify-between gap-4 p-7">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6a6a6a]">Today</div>
          <div className="mt-2 text-[22px] font-bold tracking-tight text-white">You’ve cleared every track</div>
          <div className="mt-1 text-[13.5px] text-[#a1a1a1]">Nice work. Momentum locked in — see you tomorrow.</div>
        </div>
      </Card>
    )
  }
  return (
    <Card variant="soft" className="cg-w flex flex-wrap items-center justify-between gap-5 p-7">
      <div className="min-w-0">
        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6a6a6a]">Pick up where you left off</div>
        <div className="mt-2 flex items-center gap-3">
          <div className="text-[24px] font-bold tracking-tight text-white">{resume.name}</div>
          {resume.behind > 0 ? <span className="rounded-full border border-[#ff5252]/40 bg-[#ff5252]/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-[#ff5252]">{resume.behind}d behind</span> : null}
        </div>
        <div className="mt-1.5 truncate text-[14px] text-[#a1a1a1]">{resume.obj}</div>
      </div>
      <Link to={resume.to} className="inline-flex flex-none items-center gap-1.5 rounded-xl bg-[#f4f4f4] px-5 py-3 text-[14px] font-semibold text-[#0b0b0b] transition-transform hover:-translate-y-0.5 [&>svg]:h-4 [&>svg]:w-4">
        Continue <IconChevron />
      </Link>
    </Card>
  )
}

/* ---------- track card — big translucent gradient logo, fully clickable ---------- */
function TrackCard({ t }) {
  return (
    <Link to={t.to} className="track2-link block h-full" aria-label={`Open ${t.name}`}>
      <Card variant="soft" className="cg-w track2 h-full">
        <span className="track2-logo" aria-hidden="true"><t.Icon /></span>
        <div className="track2-body">
          <div className="track2-name">{t.name}</div>
          {t.late && t.pace ? <span className="track2-behind">{t.pace}</span> : null}
        </div>
      </Card>
    </Link>
  )
}

/* ---------- right rail ---------- */
// Replaces the old Momentum sparkline: the week's bar chart already exists on the
// Overview page, whereas nothing surfaced the checklist board from home.
function ChecklistCard() {
  const [lists] = useStore(CHECKLIST_KEY, [])
  const sum = checklistSummary(lists)
  const feed = urgentFeed(lists).slice(0, 3)
  const now = nowMins()

  return (
    <Link to="/checklist" className="ck-home-link block">
      <Card variant="soft" className="cg-w ck-home flex flex-col p-6">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] text-[#a1a1a1]">
            <span className="ck-home-ico" aria-hidden="true"><IconChecklist /></span>Checklist
          </span>
          {sum.criticalOpen > 0
            ? <span className="ck-home-crit">{sum.criticalOpen} critical</span>
            : <span className="text-[12.5px] text-[#737373]">{sum.active} active</span>}
        </div>

        <div className="mt-1 text-[26px] font-bold tracking-tight text-white">
          {sum.openItems}<span className="ml-1.5 text-[13px] font-normal text-[#737373]">open {sum.openItems === 1 ? 'objective' : 'objectives'}</span>
        </div>

        <div className="ck-bar ck-bar--wide mt-3" role="progressbar" aria-valuenow={sum.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Checklist completion">
          <i style={{ width: sum.pct + '%', background: sum.pct === 100 ? '#2FB893' : '#e6e6e6' }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-[#6a6a6a]">
          <span>{sum.doneItems} of {sum.totalItems} done</span>
          <span>{sum.doneToday} today</span>
        </div>

        <div className="ck-home-feed">
          {feed.length === 0
            ? <div className="ck-empty-sm">No objectives yet — open the board to add one.</div>
            : feed.map((r) => {
              const st = timeState(r.item, now)
              return (
                <div className="ck-home-row" key={r.item.id}>
                  <span className="ck-home-pip" style={{ background: r.urgency.color }} aria-hidden="true" />
                  <span className="ck-home-t">{r.item.text}</span>
                  {r.item.start != null && (
                    <span className={'ck-time is-' + (st || 'later')}>{fmtRange(r.item.start, r.item.end)}</span>
                  )}
                </div>
              )
            })}
        </div>

        <span className="ck-home-cta">Open board <IconChevron /></span>
      </Card>
    </Link>
  )
}

function ScheduleCard() {
  const today = todayISO()
  const rel = (iso) => { const n = Math.round((new Date(iso + 'T00:00') - new Date(today + 'T00:00')) / 86400000); return n <= 0 ? 'Today' : n === 1 ? 'Tomorrow' : `in ${n}d` }
  const contests = getStore('col:contests', [])
    .filter((c) => c.starts_at && c.starts_at.slice(0, 10) >= today)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 3)
  return (
    <Card variant="soft" className="cg-w track-card flex h-full flex-col p-6">
      <div className="text-[13px] text-[#a1a1a1]">Schedule</div>
      <div className="mt-0.5 text-[12.5px] text-[#737373]">Upcoming contests you registered.</div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        {contests.length ? contests.map((c) => (
          <Link key={c.id} to="/dsa" className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]">
            <span className="w-[70px] flex-none text-[12px] font-semibold tabular-nums text-[#d4d4d4]">{rel(c.starts_at.slice(0, 10))}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-[#fafafa]">{c.name}</span><span className="block text-[11.5px] text-[#737373]">{c.platform}</span></span>
          </Link>
        )) : <div className="text-[12.5px] text-[#737373]">No contests registered. Add one on the DSA page.</div>}
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-[#191919] pt-3">
        <span className="flex-1 text-[13px] text-[#d4d4d4]">Contest notifications</span>
        <Toggle storeKey="notif:contests" def={true} />
      </div>
    </Card>
  )
}

function Toggle({ storeKey, def }) {
  const [on, setOn] = useStore(storeKey, def)
  return <button onClick={() => setOn((x) => !x)} className={'cg-toggle ' + (on ? 'is-on' : '')} aria-pressed={on}><span /></button>
}

function Calendar() {
  const [openDay, setOpenDay] = useState(null)
  const heat = useMemo(() => activitySectionLevels(), [])
  const sections = openDay ? [
    { name: 'ML', pct: Math.round((readingStats('math').pct + readingStats('handson').pct) / 2) },
    { name: 'System Design', pct: readingStats('system-design').pct },
    { name: 'CS Core', pct: getStore('cs:stats', { pct: 0 }).pct },
    { name: 'Full Stack', pct: getStore('odin:stats', { pct: 0 }).pct },
  ] : []
  const overall = sections.length ? Math.round(sections.reduce((a, s) => a + s.pct, 0) / sections.length) : 0
  const entries = openDay ? entriesForDate(openDay) : []
  return (
    <>
      <CalendarCard heatLevels={heat} onPick={setOpenDay} title="Calendar" fill legend />
      <Modal open={!!openDay} onClose={() => setOpenDay(null)} title={openDay ? new Date(openDay + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''} maxWidth={440}>
        <div className="cal-pop-overall">
          <div className="cal-pop-o-top"><span>Overall completion</span><b>{overall}%</b></div>
          <span className="cal-pop-obar"><i style={{ width: overall + '%' }} /></span>
          <div className="cal-pop-bars">
            {sections.map((s) => (
              <div className="cal-pop-bar" key={s.name}>
                <span className="cal-pop-bl">{s.name}</span>
                <span className="cal-pop-track"><i style={{ width: s.pct + '%' }} /></span>
                <span className="cal-pop-bv">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="cal-pop-entries">
          <div className="cal-pop-eh">Activity this day</div>
          {entries.length ? entries.map((e, i) => (
            <Link key={i} to={e.to} className="home-cal-entry" onClick={() => setOpenDay(null)}><span className="home-cal-etag">{e.kind}</span><span className="home-cal-el">{e.label}</span><span className="home-cal-ego">→</span></Link>
          )) : <div className="home-cal-empty">No activity logged this day.</div>}
        </div>
      </Modal>
    </>
  )
}

/* ---------- roadmap (bottom of home) — a segmented month ruler with phase blocks ---------- */
const TL_MONTHS = [
  { m: 'August', s: 'AUG', w: 20 },
  { m: 'September', s: 'SEP', w: 26 },
  { m: 'October', s: 'OCT', w: 24 },
  { m: 'November', s: 'NOV', w: 15 },
  { m: 'December', s: 'DEC', w: 15 },
]
const REVISION_START = 77.5 // % across the ruler ≈ Nov 15
const REVISION_END = 85 // ≈ Nov 30 (the Nov / Dec boundary)
const TL_P1 = [
  { name: 'DSA', Icon: IconDsa, to: '/dsa' },
  { name: 'HLD', Icon: IconSys, to: '/system-design' },
  { name: 'CS Fundamentals', Icon: IconCs, to: '/cs-core' },
]
const TL_P2 = [
  { name: 'LLD', Icon: IconLld, to: '/lld' },
  { name: 'DSA Contests', Icon: IconDsa, to: '/dsa' },
  { name: 'Projects', Icon: null },
  { name: 'Intern project', Icon: null },
  { name: 'SQL 50', Icon: null },
]

function TLChip({ Icon, name, to }) {
  const inner = (
    <span className="tl-chip flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-[7px] transition-colors group-hover:border-white/25 group-hover:bg-white/[0.09]">
      {Icon
        ? <span className="grid h-[19px] w-[19px] flex-none place-items-center rounded-full text-[#0c0c0c] [&>svg]:block [&>svg]:h-3 [&>svg]:w-3" style={{ background: 'linear-gradient(140deg,#f0f0f0,#b2b2b2)' }}><Icon /></span>
        : <span className="h-1.5 w-1.5 flex-none rounded-full bg-white/45" />}
      <span className="whitespace-nowrap text-[12px] font-semibold text-[#e6e6e6]">{name}</span>
    </span>
  )
  return to ? <Link to={to} className="group" aria-label={`Open ${name}`}>{inner}</Link> : inner
}
function TLArrow() {
  return (
    <div className="flex items-center justify-center self-center text-white/35">
      <svg className="rotate-90 sm:rotate-0" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h14M13 6l6 6-6 6" /></svg>
    </div>
  )
}
function TLPhase({ n, range, items, style }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-white/[0.09] p-3.5" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015))', ...style }}>
      <div className="mb-2.5 flex items-center justify-between gap-1 px-0.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">Phase {n}</span>
        <span className="text-[11.5px] font-semibold text-[#cfcfcf]">{range}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">{items.map((it) => <TLChip key={it.name} {...it} />)}</div>
    </div>
  )
}

function Timeline() {
  return (
    <Card variant="soft" className="cg-w overflow-hidden p-6 sm:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6a6a6a]">Roadmap</div>
          <div className="mt-1 text-[15px] font-semibold text-white">The road to placements</div>
        </div>
        <div className="text-[12.5px] text-[#737373]">Aug – Dec 2026</div>
      </div>

      {/* ── month ruler with the revision marker ── */}
      <div className="relative mt-7">
        {/* revision band spanning Nov 15 → 30, with a flag above */}
        <div className="pointer-events-none absolute inset-y-0 z-20" style={{ left: `${REVISION_START}%`, width: `${REVISION_END - REVISION_START}%` }}>
          <div className="absolute inset-y-0 rounded-md border-x border-dashed border-white/35 bg-white/[0.07]" style={{ left: '-1px', right: '-1px' }} />
          <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#111] px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/70">Revision · Nov 15–30</div>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          {TL_MONTHS.map((mo) => (
            <div key={mo.m} className="border-r border-white/10 px-3 py-2.5 text-[12.5px] font-semibold text-[#cfcfcf] last:border-r-0" style={{ width: `${mo.w}%` }}>
              <span className="hidden sm:inline">{mo.m}</span><span className="sm:hidden">{mo.s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── phase flow: Phase 1 → Phase 2 → Revision, aligned under their months ── */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-[46fr_auto_30fr_auto_24fr] sm:items-stretch sm:gap-2">
        <TLPhase n="01" range="Aug – Sep" items={TL_P1} />
        <TLArrow />
        <TLPhase n="02" range="October" items={TL_P2} />
        <TLArrow />
        <div className="flex min-w-0 flex-col justify-center rounded-2xl border border-dashed border-white/20 p-3.5" style={{ background: 'rgba(255,255,255,.02)' }}>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">Revision</span>
          <span className="mt-1 text-[14px] font-semibold text-white">Nov 15 – 30</span>
          <span className="mt-0.5 text-[11px] text-[#7c7c7c]">Consolidate &amp; mock</span>
        </div>
      </div>

      {/* ── Full Stack — one continuous track spanning the whole timeline ── */}
      <Link to="/full-stack" aria-label="Open Full Stack"
        className="group relative mt-4 flex h-[48px] items-center justify-center gap-2.5 rounded-full border border-white/[0.09] px-12 transition-colors hover:border-white/20"
        style={{ background: 'linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.1), rgba(255,255,255,.05))' }}>
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '9px solid rgba(255,255,255,.55)' }} />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '9px solid rgba(255,255,255,.55)' }} />
        <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-[#0c0c0c] [&>svg]:block [&>svg]:h-[15px] [&>svg]:w-[15px]" style={{ background: 'linear-gradient(140deg,#f0f0f0,#b2b2b2)' }}><IconOdin /></span>
        <span className="text-[13.5px] font-semibold tracking-tight text-white">Full Stack</span>
        <span className="hidden text-[11.5px] text-white/45 sm:inline">· continuous, Aug – Dec</span>
      </Link>
    </Card>
  )
}

/* ---------- page ---------- */
export default function CryptgenBento() {
  const { tracks, completion, resume, streak, overall } = useToday()
  return (
    <div className="home-page mx-auto w-full max-w-[1400px] px-4 sm:px-6">
      <svg width="0" height="0" className="absolute"><defs><linearGradient id="ringmono" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7a7a7a" /><stop offset="1" stopColor="#f4f4f4" /></linearGradient><radialGradient id="cgLogoGrad" gradientUnits="userSpaceOnUse" cx="9.32" cy="-3.25" r="14.68" fx="9.32" fy="-3.25" gradientTransform="matrix(1 0 0 2.92 0 6.24)"><stop offset="0" stopColor="#3b3b3b" /><stop offset="0.1261" stopColor="#888787" /><stop offset="0.5" stopColor="#ffffff" /><stop offset="0.8" stopColor="#888787" /><stop offset="1" stopColor="#3b3b3b" /></radialGradient></defs></svg>
      <Reveal><TopBar resume={resume} streak={streak} completion={completion} overall={overall} /></Reveal>
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Reveal delay={0}><ResumeBand resume={resume} /></Reveal>
          {/* One swipeable deck: all six tracks on page 1, the AI review on page 2. */}
          <SwipeDeck
            label="Tracks and AI review"
            pages={[
              {
                key: 'tracks',
                label: 'Tracks',
                node: (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {tracks.map((t, i) => <Reveal key={t.key} delay={0.05 + i * 0.04}><TrackCard t={t} /></Reveal>)}
                  </div>
                ),
              },
              { key: 'ai', label: 'AI review', node: <AiPanel /> },
            ]}
          />
        </div>
        <div className="flex flex-col gap-5">
          <Reveal delay={0.06}><ChecklistCard /></Reveal>
          <Reveal delay={0.1} className="flex min-h-0 flex-1 flex-col"><Calendar /></Reveal>
        </div>
      </div>
      <div className="mt-5">
        {/* No scroll-reveal wrapper here: whileInView's negative viewport margin
            could leave this bottom section stuck at opacity:0 on mobile. Render it directly. */}
        <Timeline />
      </div>
    </div>
  )
}
