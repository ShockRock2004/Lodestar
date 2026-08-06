import { Link } from 'react-router-dom'
import { Gauge, Sparkline, CountUp } from '../components/viz.jsx'
import {
  IconDsa, IconSys, IconCs, IconMl, IconFlame, IconFlag,
  IconArrowUp, IconChevron, IconBell, IconUser,
} from '../components/icons.jsx'
import { readingStats, activityLast7 } from '../lib/progress.js'
import { getStore, todayISO } from '../lib/store.js'

const shortDate = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

function trailingStreak(raw) {
  let s = 0
  for (let i = raw.length - 1; i >= 0; i--) { if (raw[i] > 0) s++; else break }
  return s
}

export default function Home() {
  const sd = readingStats('system-design')
  const math = readingStats('math')
  const hands = readingStats('handson')
  const cs = getStore('cs:stats', { pct: 0, done: 0, total: 0 })
  const quant = getStore('col:quant', [])
  const dsaLog = getStore('col:dsa', [])
  const act = activityLast7()

  const mlPct = Math.round((math.pct + hands.pct) / 2)
  const parts = [sd.pct, mlPct]
  if (cs.total) parts.push(cs.pct)
  const overall = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)

  const todayProblem = dsaLog.find((x) => x.date === todayISO())
  const readingDaysLeft = (sd.total - sd.done) + (math.total - math.done) + (hands.total - hands.done)
  const streak = trailingStreak(act.raw)

  const tiles = [
    { to: '/dsa', active: true, Icon: IconDsa, label: 'DSA', flag: 'TODAY',
      sub: todayProblem ? `${todayProblem.title} · ${todayProblem.score}/5` : 'Log today’s problem',
      pct: Math.min(100, Math.round((act.raw.slice(-7).filter((v) => v > 0).length / 7) * 100)) },
    { to: '/system-design', Icon: IconSys, label: 'System\nDesign', pct: sd.pct,
      sub: `Day ${sd.currentDay} of ${sd.total} · ${sd.day ? sd.day.chapters[0] : ''}` },
    { to: '/cs-core', Icon: IconCs, label: 'CS Core', pct: cs.pct,
      sub: cs.total ? `${cs.done} of ${cs.total} videos done` : 'Open to load curriculum' },
    { to: '/ml-quant', Icon: IconMl, label: 'ML · Quant', pct: mlPct,
      sub: `Math d${math.currentDay} · Hands-On d${hands.currentDay}` },
  ]

  const todayRows = [
    { to: '/dsa', name: 'DSA', act: todayProblem ? `${todayProblem.title} · scored ${todayProblem.score}/5` : 'Log today’s problem', done: !!todayProblem },
    { to: '/cs-core', name: 'CS Core', act: cs.total ? `${cs.total - cs.done} videos remaining` : 'Load the curriculum' },
    { to: '/system-design', name: 'System Design', act: sd.day ? `Day ${sd.currentDay} · pp. ${sd.day.from}–${sd.day.to}` : 'Complete' },
    { to: '/ml-quant', name: 'ML · Quant', act: math.day ? `Day ${math.currentDay} · ${math.day.chapters[0]}` : 'Complete' },
  ]

  return (
    <>
      <section className="hero reveal">
        <div>
          <div className="eye">{shortDate()}</div>
          <h1>Let’s <em>study.</em></h1>
          <p>You’re {overall}% through your overall plan{streak > 1 ? ` — ${streak}-day streak going` : ''}.</p>
        </div>
        <div className="hero-side">
          <button className="iconbtn" aria-label="Notifications"><IconBell /><span className="badge" /></button>
          <div className="me"><IconUser /></div>
        </div>
      </section>

      <section className="tiles reveal">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className={t.active ? 'tile active' : 'tile'}>
            {t.active ? <span className="flag">{t.flag}</span> : <span className="pct">{t.pct}%</span>}
            <span className="ico"><t.Icon /></span>
            <div>
              <div className="lab">{t.label.split('\n').map((l, i) => (
                <span key={i}>{l}{i === 0 && t.label.includes('\n') ? <br /> : null}</span>
              ))}</div>
              <div className="sub">{t.sub}</div>
              <div className="mini"><i style={{ width: `${t.pct}%` }} /></div>
            </div>
          </Link>
        ))}
      </section>

      <div className="lower reveal">
        <section className="card gauge">
          <div className="ctitle">Overall progress</div>
          <Gauge pct={overall} label="Complete" />
          <div className="legend">
            <div><span className="dot" style={{ background: '#2F7BF6' }} /><span className="t"><b>{overall}%</b>Completed</span></div>
            <div><span className="dot" style={{ background: 'var(--remain)' }} /><span className="t"><b>{100 - overall}%</b>Remaining</span></div>
          </div>
          <div className="gfoot">
            <div className="chip2 s"><IconFlame /><div><div className="fx">{streak} {streak === 1 ? 'day' : 'days'}</div><div className="fl">Current streak</div></div></div>
            <div className="chip2 g"><IconFlag /><div><div className="fx">{readingDaysLeft} days</div><div className="fl">Reading left</div></div></div>
          </div>
        </section>

        <section className="card act">
          <div className="row1">
            <div><div className="ctitle">Last 7 days</div><div className="big"><CountUp value={act.total} /></div><div className="u">Tasks completed</div></div>
            {act.total > 0 && <div className="delta"><IconArrowUp />{streak}d</div>}
          </div>
          <div className="chart">
            <Sparkline values={act.values} />
            <div className="days">
              {act.labels.map((l, i) => <span key={i} className={i === act.labels.length - 1 ? 'on' : undefined}>{l}</span>)}
            </div>
          </div>
        </section>

        <section className="card today">
          <div className="ctitle">Today’s targets</div>
          <div className="list">
            {todayRows.map((r) => (
              <Link key={r.to} to={r.to} className={r.done ? 'trow done' : 'trow'}>
                <span className="st">
                  {r.done
                    ? <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="#2FB893" /><path d="M8 12l3 3 5-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--ink-3)" strokeWidth="2"><circle cx="12" cy="12" r="6.5" /></svg>}
                </span>
                <span className="tx"><div className="n">{r.name}</div><div className="a">{r.act}</div></span>
                {r.done ? <span className="donemark">Done</span> : <span className="go" aria-hidden="true"><IconChevron /></span>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
