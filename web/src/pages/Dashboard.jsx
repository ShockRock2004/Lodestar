import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils.js'
import { Card } from '../components/ui/card.jsx'
import { GlassSurface } from '../components/ui/glass-surface.jsx'
import { GlassButton } from '../components/ui/glass-button.jsx'
import { readingStats, activityLast7 } from '../lib/progress.js'
import { getStore } from '../lib/store.js'
import {
  IconHome, IconGrid, IconSearch, IconPlus, IconCalendar, IconUser,
  IconDsa, IconSys, IconCs, IconMl, IconFlame, IconArrowUp,
} from '../components/icons.jsx'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }
const item = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}


const SUBJECTS = [
  { to: '/dsa', Icon: IconDsa, name: 'DSA', color: '#e6e6e6', m: 'Trapping Rain Water', pct: 64 },
  { to: '/system-design', Icon: IconSys, name: 'System Design', color: '#cfcfcf' },
  { to: '/cs-core', Icon: IconCs, name: 'CS Core', color: '#bdbdbd' },
  { to: '/ml-quant', Icon: IconMl, name: 'ML / Quant', color: '#d6d6d6' },
]

export default function Dashboard() {
  const nav = useNavigate()
  const rm = useReducedMotion()
  const sd = readingStats('system-design')
  const act = activityLast7()
  const overall = Math.round((sd.pct + readingStats('math').pct + readingStats('handson').pct) / 3)
  const ringLen = 2 * Math.PI * 88
  const cs = getStore('cs:stats', { pct: 0, done: 0, total: 0 })
  const mlp = Math.round((readingStats('math').pct + readingStats('handson').pct) / 2)
  const subjData = {
    '/dsa': { m: 'Trapping Rain Water', pct: 64 },
    '/system-design': { m: 'Day ' + sd.currentDay + ' / ' + sd.total, pct: sd.pct },
    '/cs-core': { m: cs.total ? cs.done + '/' + cs.total + ' done' : '3 videos today', pct: cs.pct },
    '/ml-quant': { m: 'Day ' + readingStats('math').currentDay + ' / SVMs', pct: mlp },
  }
  const dockItems = [
    { Icon: IconHome, to: '/', on: true }, { Icon: IconGrid, to: '/search' }, { Icon: IconSearch, to: '/search' },
    { Icon: IconPlus, to: '/dsa' }, { Icon: IconCalendar, to: '/' }, { Icon: IconUser, to: '/' },
  ]
  const bars = act.values.some((v) => v) ? act.values : [40, 62, 34, 76, 52, 90, 70]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-10">

        <motion.div variants={container} initial={rm ? false : "hidden"} animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <motion.div variants={item} className="md:col-span-2 md:row-span-2">
            <Card variant="focus" interactive className="flex h-full min-h-[300px] flex-col justify-between p-7">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Focus / right now</div>
                <h1 className="cg-chrome mt-3 text-5xl font-extrabold leading-[1.02] tracking-[-0.02em]">System Design<br />Day {sd.currentDay}</h1>
                <p className="mt-2 text-[15px] text-[hsl(var(--muted-foreground))]">{sd.day ? 'pp. ' + sd.day.from + '-' + sd.day.to + ' / ' + sd.day.chapters[0] : 'Complete'}</p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <GlassButton size="sm" onClick={() => nav('/system-design')}>Open</GlassButton>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">18 min / 10 pages today</span>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item} className="md:col-span-2 md:row-span-2">
            <Card variant="soft" className="flex h-full min-h-[300px] flex-col items-center justify-center p-7">
              <div className="relative grid place-items-center" style={{ width: 210, height: 210 }}>
                <svg viewBox="0 0 210 210" className="absolute inset-0 -rotate-90">
                  <circle cx="105" cy="105" r="88" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
                  <motion.circle cx="105" cy="105" r="88" fill="none" stroke="url(#dg)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={ringLen} initial={rm ? false : { strokeDashoffset: ringLen }} animate={{ strokeDashoffset: ringLen - (ringLen * overall) / 100 }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
                  <defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8a8a8a" /><stop offset=".5" stopColor="#dcdcdc" /><stop offset="1" stopColor="#ffffff" /></linearGradient></defs>
                </svg>
                <div className="text-center"><div className="text-5xl font-extrabold tracking-tight text-white">{overall}%</div><div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">on track</div></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] [&>svg]:h-4 [&>svg]:w-4"><IconFlame /> 12-day streak / 4 of 6 today</div>
            </Card>
          </motion.div>

          {SUBJECTS.map((s) => (
            <motion.div variants={item} key={s.to}>
              <Card variant="subject" interactive onClick={() => nav(s.to)}
                className="flex h-full min-h-[150px] flex-col p-5">
                <span className="grid h-9 w-9 place-items-center rounded-xl [&>svg]:h-5 [&>svg]:w-5" style={{ background: 'rgba(255,255,255,0.06)', color: s.color }}><s.Icon /></span>
                <div className="mt-4 text-[15px] font-semibold text-white">{s.name}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{subjData[s.to].m}</div>
                <div className="mt-auto flex items-center gap-3 pt-3">
                  <span className="text-sm font-bold text-white">{subjData[s.to].pct}%</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><i className="block h-full rounded-full" style={{ width: subjData[s.to].pct + '%', background: s.color }} /></span>
                </div>
              </Card>
            </motion.div>
          ))}

          <motion.div variants={item} className="md:col-span-4">
            <Card variant="soft" className="flex items-center gap-7 p-6">
              <div><div className="text-2xl font-extrabold text-white">{act.total || 0} tasks</div><div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">this week <span className="ml-1 flex items-center font-bold text-emerald-300 [&>svg]:h-3.5 [&>svg]:w-3.5"><IconArrowUp />22%</span></div></div>
              <div className="flex h-[70px] flex-1 items-end gap-2.5">
                {bars.map((v, i) => (
                  <motion.b key={i} initial={rm ? false : { height: 0 }} animate={{ height: Math.max(8, v) + '%' }} transition={{ delay: 0.4 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 rounded-md bg-[#d7d7d7]" />
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
  )
}
