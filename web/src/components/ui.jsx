import { useEffect, useRef, useState } from 'react'

// Themed custom dropdown (replaces native <select>). Options are { v, l }.
export function Dropdown({ value, onChange, options, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  const cur = options.find((o) => o.v === value) || options[0]
  return (
    <div className="dsel" ref={ref}>
      <button type="button" className="dsel-field" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}>
        <span>{cur ? cur.l : 'Select'}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={open ? 'dsel-chev open' : 'dsel-chev'}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="dsel-pop" role="listbox">
          {options.map((o) => (
            <button type="button" key={o.v} role="option" aria-selected={o.v === value} className={'dsel-opt' + (o.v === value ? ' on' : '')} onClick={() => { onChange(o.v); setOpen(false) }}>{o.l}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// Donut ring split into coloured segments. `segments` = [{ label, value, color }].
export function Donut({ segments, centerValue, centerLabel, size = 104, stroke = 13 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const sum = segments.reduce((a, s) => a + s.value, 0)
  let offset = 0
  return (
    <div className="q-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a1e" strokeWidth={stroke} />
        {sum > 0 && segments.map((s) => {
          if (!s.value) return null
          const len = (s.value / sum) * c
          const el = <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap="butt" />
          offset += len
          return el
        })}
      </svg>
      <div className="q-donut-c"><b>{centerValue}</b>{centerLabel ? <span>{centerLabel}</span> : null}</div>
    </div>
  )
}

export function SmallRing({ pct = 0, size = 54, stroke = 6, showValue = true }) {
  const r = (size - stroke) / 2 - Math.max(2, Math.round(size * 0.07))
  const c = 2 * Math.PI * r
  const off = c - (c * pct) / 100
  return (
    <div className="sring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#gg)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset .6s var(--ease)' }} />
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7a7a7a" /><stop offset="1" stopColor="#f4f4f4" />
          </linearGradient>
        </defs>
      </svg>
      {showValue && <span className="sringv">{pct}%</span>}
    </div>
  )
}

export function Bar({ pct = 0 }) {
  return <div className="ubar"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
}

export function Chip({ children, tone }) {
  return <span className={tone ? `uchip ${tone}` : 'uchip'}>{children}</span>
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="useg" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value}
          className={value === o.value ? 'on' : undefined} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <div className="empty-t">{title}</div>
      {children && <div className="empty-b">{children}</div>}
    </div>
  )
}
