import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { AuroraBackground } from './aceternity/aurora-background.jsx'
import { GlassFilter } from './ui/glass-surface.jsx'
import GlassNavbar from './GlassNavbar.jsx'
import { initGlow } from '../lib/glow.js'

export default function AppLayout() {
  useEffect(() => initGlow(), [])
  return (
    <AuroraBackground>
      <GlassFilter />
      <GlassNavbar />
      <div className="in relative z-10 min-h-screen pb-16 pt-20">
        <Outlet />
      </div>
    </AuroraBackground>
  )
}
