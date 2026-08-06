import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { GlassSurface } from './ui/glass-surface.jsx'
import { GlassButton } from './ui/glass-button.jsx'
import { cn } from '../lib/utils.js'
import { IconSearch, IconHome, IconDsa, IconCs, IconMl, IconSys, IconOdin, IconLld, FlameFire, LodestarMark } from './icons.jsx'
import { activityRange } from '../lib/progress.js'

const LINKS = [
  { to: '/', label: 'Home', Icon: IconHome },
  { to: '/dsa', label: 'DSA', Icon: IconDsa },
  { to: '/ml-quant', label: 'ML · Quant', Icon: IconMl },
  { to: '/cs-core', label: 'CS Core', Icon: IconCs },
  { to: '/system-design', label: 'System Design', Icon: IconSys },
  { to: '/full-stack', label: 'Full Stack', Icon: IconOdin },
  { to: '/lld', label: 'Low Level Design', Icon: IconLld },
]
const MOBILE = [
  ...LINKS,
  { to: '/search', label: 'Search', Icon: IconSearch },
]

// One spring shared by every scroll-driven size change so the pill, search bar
// and nav links resize in perfect lockstep (seamless, no CSS-transition jank).
const SPRING = { type: 'spring', stiffness: 210, damping: 30, mass: 1 }

function navStreak() {
  const range = activityRange(120)
  let s = 0, i = range.length - 1
  if (range[i] && range[i].count === 0) i--
  for (; i >= 0 && range[i] && range[i].count > 0; i--) s++
  return s
}

export default function GlassNavbar() {
  const loc = useLocation()
  const nav = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const rm = useReducedMotion()
  const activeIdx = Math.max(0, LINKS.findIndex((l) => l.to === loc.pathname))
  const [hovered, setHovered] = useState(activeIdx)
  const [streak, setStreak] = useState(0)
  useEffect(() => { setStreak(navStreak()) }, [loc.pathname])

  useEffect(() => setHovered(activeIdx), [activeIdx])
  useEffect(() => {
    // hysteresis so a scroll position hovering right at the threshold can't rapidly toggle
    const onScroll = () => setScrolled((prev) => (prev ? window.scrollY > 24 : window.scrollY > 56))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement
      const typing = el && (/^(input|textarea|select)$/i.test(el.tagName) || el.isContentEditable)
      if (e.key === '/' && !typing && loc.pathname !== '/search') { e.preventDefault(); nav('/search') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nav, loc.pathname])

  const tr = rm ? { duration: 0 } : SPRING

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <motion.div
        className="pointer-events-auto w-full"
        initial={false}
        animate={{ maxWidth: scrolled ? 720 : 1000 }}
        transition={tr}
        style={{ marginInline: 'auto' }}
      >
        <GlassSurface
          variant="nav"
          className={cn(
            'flex w-full items-center gap-3 py-2 pl-3.5 pr-2 transition-shadow duration-500',
            scrolled ? 'shadow-[0_12px_36px_rgba(0,0,0,0.55)]' : 'shadow-none',
          )}
        >
          <Link to="/" className="flex flex-none items-center gap-2.5">
            <LodestarMark size={26} />
            <span className="hidden text-[15px] font-semibold tracking-tight text-white sm:inline">Lodestar</span>
          </Link>

          <nav className="relative hidden flex-none items-center gap-0.5 sm:flex" onMouseLeave={() => setHovered(activeIdx)}>
            {LINKS.map((l, i) => (
              <Link key={l.to} to={l.to} onMouseEnter={() => setHovered(i)} aria-label={l.label} title={l.label}
                aria-current={loc.pathname === l.to ? 'page' : undefined}
                className={cn('relative grid h-9 w-9 place-items-center rounded-full [&_svg]:h-[18px] [&_svg]:w-[18px]',
                  loc.pathname === l.to ? 'text-white' : 'text-white/65 hover:text-white')}>
                {hovered === i && (
                  <motion.span layoutId="nav-highlight" className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                )}
                <span className="relative z-10"><l.Icon /></span>
              </Link>
            ))}
          </nav>

          {/* integrated search (desktop) — width springs from a full field to an icon */}
          <motion.button
            onClick={() => nav('/search')} aria-label="Search" title="Search"
            initial={false}
            animate={{ width: scrolled ? 40 : 260 }}
            transition={tr}
            className="ml-auto hidden h-9 flex-none items-center gap-2 overflow-hidden rounded-full border border-[#474747] bg-[#0e0e0e] px-3 text-sm text-white/45 transition-colors hover:text-white/70 sm:flex"
          >
            <span className="flex-none [&>svg]:h-4 [&>svg]:w-4"><IconSearch /></span>
            <motion.span
              className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap"
              initial={false}
              animate={{ opacity: scrolled ? 0 : 1 }}
              transition={{ duration: scrolled ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1], delay: scrolled ? 0 : 0.06 }}
            >
              <span className="truncate">Search…</span>
              <kbd className="ml-auto flex-none rounded border border-[#474747] px-1.5 py-0.5 text-[11px] text-white/50">/</kbd>
            </motion.span>
          </motion.button>

          {/* streak fire pill */}
          <div className="ml-1 hidden flex-none items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#0e0e0e] px-2.5 py-1.5 sm:flex"
            title={`${streak}-day streak`} aria-label={`${streak} day streak`}>
            <FlameFire size={16} /><span className="text-[13px] font-bold text-white tabular-nums">{streak}</span>
          </div>

          <GlassButton size="sm" className="hidden flex-none sm:inline-flex" onClick={() => nav('/system-design')}>Continue</GlassButton>

          {/* inline icons (mobile) */}
          <div className="ml-auto flex flex-none items-center gap-0.5 sm:hidden">
            {MOBILE.map((l) => (
              <Link key={l.to} to={l.to} aria-label={l.label} aria-current={loc.pathname === l.to ? 'page' : undefined}
                className={cn('grid h-8 w-8 place-items-center rounded-full transition-colors [&>svg]:h-[17px] [&>svg]:w-[17px]',
                  loc.pathname === l.to ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white')}>
                <l.Icon />
              </Link>
            ))}
          </div>
        </GlassSurface>
      </motion.div>
    </div>
  )
}
