import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../App.jsx'
import {
  IconHome, IconGrid, IconCalendar, IconPlus, IconUser, IconBell,
  IconSun, IconMoon,
} from './icons.jsx'

function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme()
  return (
    <button className={className} onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      {theme === 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  )
}

const navClass = ({ isActive }) => (isActive ? 'on' : undefined)

export default function AppShell() {
  const shellRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    const el = shellRef.current
    if (!el) return
    el.classList.remove('in')
    // next frame → replay entrance on route change
    const id = requestAnimationFrame(() => el.classList.add('in'))
    return () => cancelAnimationFrame(id)
  }, [location.pathname])

  return (
    <>
      <div className="amb" aria-hidden="true">
        <b className="b1" /><b className="b2" />
      </div>

      <div className="app">
        {/* sidebar — web */}
        <aside className="sidebar">
          <NavLink to="/" className="logo" aria-label="Lodestar home" />
          <NavLink to="/" end className={navClass} aria-label="Home"><IconHome /></NavLink>
          <NavLink to="/search" className={navClass} aria-label="Browse & search"><IconGrid /></NavLink>
          <button className="cal" aria-label="Calendar" title="Calendar (soon)"
            style={{ width: 46, height: 46, borderRadius: 15, background: 'transparent', border: 0, color: 'var(--ink-2)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <IconCalendar />
          </button>
          <div className="log" role="button" tabIndex={0} aria-label="Log activity"><IconPlus /></div>
          <div className="grow" />
          <ThemeToggle className="side-toggle" />
          <div className="me"><IconUser /></div>
        </aside>

        <div className="shell" ref={shellRef}>
          {/* mobile top bar */}
          <header className="mtop">
            <div className="wm"><span className="g" />Lodestar</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <ThemeToggle className="iconbtn" />
              <button className="iconbtn" aria-label="Notifications"><IconBell /><span className="badge" /></button>
            </div>
          </header>

          <Outlet />

          {/* mobile bottom nav */}
          <nav className="botnav">
            <NavLink to="/" end className={navClass} aria-label="Home"><IconHome /></NavLink>
            <NavLink to="/search" className={navClass} aria-label="Browse & search"><IconGrid /></NavLink>
            <div className="fab" role="button" tabIndex={0} aria-label="Log activity"><IconPlus /></div>
            <button className="cal2" aria-label="Calendar" title="Calendar (soon)"
              style={{ width: 34, height: 34, background: 'transparent', border: 0, color: 'rgba(255,255,255,.72)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <IconCalendar />
            </button>
            <button aria-label="Profile" title="Profile (soon)"
              style={{ width: 34, height: 34, background: 'transparent', border: 0, color: 'rgba(255,255,255,.72)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <IconUser />
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}
