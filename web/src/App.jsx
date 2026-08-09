import { createContext, useContext, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import AppLayout from './components/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CryptgenBento from './pages/CryptgenBento.jsx'
import Dsa from './pages/Dsa.jsx'
import CsCore from './pages/CsCore.jsx'
import SystemDesign from './pages/SystemDesign.jsx'
import MlQuant from './pages/MlQuant.jsx'
import Search from './pages/Search.jsx'
import Odin from './pages/Odin.jsx'
import Lld from './pages/Lld.jsx'
import DsaPlan from './pages/DsaPlan.jsx'
import Checklist from './pages/Checklist.jsx'
import { migrateLegacy } from './lib/progress.js'
import { startCloudSync } from './lib/cloudsync.js'

const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

export default function App() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark',
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('studyos-theme', theme) } catch (e) {}
  }, [theme])

  useEffect(() => { migrateLegacy(); startCloudSync() }, [])

  // Aceternity GlowingEffect driver: the iridescent border arc follows the cursor
  // around whichever card is under the pointer (sets --active / --start on each .cg-glow).
  useEffect(() => {
    let raf = 0
    const onMove = (e) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const mx = e.clientX, my = e.clientY
        document.querySelectorAll('.cg-glow').forEach((g) => {
          const card = g.parentElement
          if (!card) return
          const r = card.getBoundingClientRect()
          if (mx < r.left || mx > r.right || my < r.top || my > r.bottom) { g.style.setProperty('--active', '0'); return }
          g.style.setProperty('--active', '1')
          const ang = Math.atan2(my - (r.top + r.height / 2), mx - (r.left + r.width / 2)) * 180 / Math.PI + 90
          const cur = parseFloat(g.style.getPropertyValue('--start')) || 0
          const diff = ((ang - cur) % 360 + 540) % 360 - 180
          g.style.setProperty('--start', String(cur + diff))
        })
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('pointermove', onMove); if (raf) cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => {
    const mq = matchMedia('(min-width: 960px)')
    const apply = () =>
      document.documentElement.setAttribute('data-view', mq.matches ? 'web' : 'mobile')
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const value = { theme, setTheme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }

  return (
    <ThemeCtx.Provider value={value}>
      <MotionConfig reducedMotion="user">
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<CryptgenBento />} />
          <Route path="overview" element={<Dashboard />} />
          <Route path="dsa" element={<Dsa />} />
          <Route path="dsa/plan/:name" element={<DsaPlan />} />
          <Route path="cs-core" element={<CsCore />} />
          <Route path="system-design" element={<SystemDesign />} />
          <Route path="ml-quant" element={<MlQuant />} />
          <Route path="search" element={<Search />} />
          <Route path="full-stack" element={<Odin />} />
          <Route path="lld" element={<Lld />} />
          <Route path="checklist" element={<Checklist />} />
        </Route>
      </Routes>
      </MotionConfig>
    </ThemeCtx.Provider>
  )
}
