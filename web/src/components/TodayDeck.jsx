import { Link } from 'react-router-dom'
import { Card } from './ui/card.jsx'
import SwipeDeck from './SwipeDeck.jsx'
import { IconChecklist, IconChevron, IconCs, IconSys, IconOdin, IconLld, IconSql } from './icons.jsx'
import { useStore, useStoreTick } from '../lib/store.js'
import { CHECKLIST_KEY, checklistSummary, urgentFeed } from '../lib/checklists.js'
import { todayAgenda } from '../lib/agenda.js'
import { to12h } from '../lib/timephrase.js'

const NOW = new Date()
const DAY_NAME = NOW.toLocaleDateString('en-US', { weekday: 'long' })
const MONTH = NOW.toLocaleDateString('en-US', { month: 'long' })
const DAY_NUM = NOW.getDate()
const YEAR = NOW.getFullYear()

const TRACK_ICON = { cs: IconCs, sd: IconSys, odin: IconOdin, lld: IconLld, sql: IconSql }

function DateBlock() {
  return (
    <div className="td-date">
      <span className="td-date-num">{DAY_NUM}</span>
      <span className="td-date-rest">
        <span className="td-date-day">{DAY_NAME}</span>
        <span className="td-date-mon">{MONTH} {YEAR}</span>
      </span>
    </div>
  )
}

/* ---------- page 1 · checklist + today's date ---------- */
function ChecklistCard() {
  const [lists] = useStore(CHECKLIST_KEY, [])
  const sum = checklistSummary(lists)
  const feed = urgentFeed(lists).slice(0, 3)

  return (
    <Link to="/checklist" className="ck-home-link block h-full">
      <Card variant="soft" className="cg-w ck-home flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] text-[#a1a1a1]">
            <span className="ck-home-ico" aria-hidden="true"><IconChecklist /></span>Checklist
          </span>
          {sum.urgentOpen > 0
            ? <span className="ck-home-crit">{sum.urgentOpen} urgent</span>
            : <span className="text-[12.5px] text-[#737373]">{sum.active} active</span>}
        </div>

        <DateBlock />

        <div className="mt-3.5 text-[24px] font-bold tracking-tight text-white">
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
            : feed.map((r) => (
              <div className="ck-home-row" key={r.item.id}>
                <span className="ck-home-pip" style={{ background: r.urgency.color }} aria-hidden="true" />
                {r.item.start != null && (
                  <span className={'ck-t is-' + (r.state || 'later')}>{to12h(r.item.start)}</span>
                )}
                <span className="ck-home-t">{r.item.text}</span>
              </div>
            ))}
        </div>

        <span className="ck-home-cta">Open board <IconChevron /></span>
      </Card>
    </Link>
  )
}

/* ---------- page 2 · what every track asks for today ---------- */
// One row per track, not one per lecture: the day's remaining count and what it
// covers is the decision-making information; the individual rows live on the
// track's own page, one click away.
function AgendaRow({ s }) {
  const Icon = TRACK_ICON[s.key]
  const pct = s.total ? ((s.total - s.open) / s.total) * 100 : 0
  return (
    <Link to={s.to} className="td-row">
      <span className="td-row-ico" aria-hidden="true"><Icon /></span>
      <span className="td-row-body">
        <span className="td-row-top">
          <span className="td-row-name">{s.name}</span>
          {s.behind > 0 && <span className="td-behind">{s.behind}d</span>}
          <span className="td-row-left">{s.left}</span>
        </span>
        <span className="td-row-sub">{s.summary || s.dayLabel}</span>
        <span className="td-row-bar"><i style={{ width: pct + '%' }} /></span>
      </span>
      <span className="td-row-go" aria-hidden="true"><IconChevron /></span>
    </Link>
  )
}

function AgendaCard() {
  useStoreTick()
  const { sections, pending, quiet, openCount, behindCount } = todayAgenda()

  return (
    <Card variant="soft" className="cg-w td-agenda flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#a1a1a1]">Today’s plan</span>
        {behindCount > 0
          ? <span className="ck-home-crit">{behindCount} behind</span>
          : <span className="text-[12.5px] text-[#737373]">{pending.length} of {sections.length} tracks</span>}
      </div>

      <div className="td-head">
        <span className="td-head-n">{openCount}</span>
        <span className="td-head-l">open {openCount === 1 ? 'task' : 'tasks'}<br />across {pending.length} {pending.length === 1 ? 'track' : 'tracks'}</span>
      </div>

      <div className="td-rows">
        {pending.length === 0
          ? <div className="ck-empty-sm">Every scheduled track is clear for today. Nothing left to check off.</div>
          : pending.map((s) => <AgendaRow key={s.key} s={s} />)}
      </div>

      {quiet.length > 0 && (
        <div className="td-quiet">
          {quiet.map((s) => (
            <Link to={s.to} className={'td-chip is-' + s.state} key={s.key}>
              {s.name}
              <span className="td-chip-s">
                {s.state === 'clear' ? 'done' : s.state === 'finished' ? 'complete' : s.state === 'waiting' ? s.note : s.note}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ---------- the deck — both cards on black, sharing one shimmer border ---------- */
// Mirrors the tracks deck: each page is a bare wrapper that contributes the
// shimmering border and the black ground, with the real card sitting inside it.
export default function TodayDeck() {
  const page = (node) => <Card variant="soft" className="cg-w td-shell">{node}</Card>
  return (
    <SwipeDeck
      className="td-deck"
      label="Checklist and today’s plan"
      pages={[
        { key: 'checklist', label: 'Checklist', node: page(<ChecklistCard />) },
        { key: 'agenda', label: 'Today’s plan', node: page(<AgendaCard />) },
      ]}
    />
  )
}
