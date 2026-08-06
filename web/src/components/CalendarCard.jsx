import { useState } from 'react'
import { Card } from './ui/card.jsx'
import { todayISO } from '../lib/store.js'

// Reusable month calendar (extracted from the home dashboard).
//  - markedDates: Set<iso>       → simple light-grey box (quant "has questions")
//  - heatLevels:  { iso: 1..5 }  → 5-level activity heatmap (home)
// Clicking any day calls onPick(iso). `fill` makes the card grow to its container.
const CAL_DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function CalendarCard({ markedDates, heatLevels, onPick, title, subtitle, fill = false, legend = false }) {
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const first = new Date(ym.y, ym.m, 1)
  const startDow = first.getDay()
  const dim = new Date(ym.y, ym.m + 1, 0).getDate()
  const iso = (d) => `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)
  while (cells.length % 7) cells.push(null)
  const nav = (delta) => setYm((p) => { let m = p.m + delta, y = p.y; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } return { y, m } })
  const cellFor = (day) => {
    let cls = 'home-cal-day'
    let lvl = 0
    if (day === todayISO()) cls += ' today'
    if (heatLevels) { lvl = Math.min(5, heatLevels[day] || 0); if (lvl > 0) cls += ' heat heat-' + lvl }
    else if (markedDates && markedDates.has(day)) cls += ' marked'
    const title = lvl > 0 ? `${lvl} track${lvl > 1 ? 's' : ''} active` : undefined
    return { cls, title }
  }
  return (
    <Card variant="soft" className={'cg-w flex flex-col p-6' + (fill ? ' h-full cal-fill' : '')}>
      {title ? <div className="mb-3 text-[15px] font-semibold text-[#e8e8e8]">{title}</div> : null}
      {subtitle ? <div className="mb-3 text-[12.5px] text-[#737373]">{subtitle}</div> : null}
      <div className="home-cal-head">
        <button className="cg-cal-nav" onClick={() => nav(-1)} aria-label="Previous month">‹</button>
        <span className="home-cal-title">{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        <button className="cg-cal-nav" onClick={() => nav(1)} aria-label="Next month">›</button>
      </div>
      <div className="home-cal-grid">
        {CAL_DOW.map((d, i) => <span key={'h' + i} className="home-cal-dow">{d}</span>)}
        {cells.map((d, i) => {
          if (d == null) return <span key={i} />
          const day = iso(d)
          const { cls, title: t } = cellFor(day)
          return <button key={i} className={cls} onClick={() => onPick(day)} title={t} aria-label={`${day}${t ? ', ' + t : ''}`}>{d}</button>
        })}
      </div>
      {legend ? (
        <div className="cal-legend">
          <span className="cal-legend-l">Less</span>
          <span className="cal-legend-scale">
            <i className="cal-legend-sw heat-0" />
            {[1, 2, 3, 4, 5].map((n) => <i key={n} className={'cal-legend-sw heat-' + n} />)}
          </span>
          <span className="cal-legend-l">More</span>
        </div>
      ) : null}
    </Card>
  )
}
