import { useEffect, useState } from 'react'

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    let raf, start
    const tick = (t) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / ms)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function CountUp({ value = 0, suffix = '' }) {
  return <>{useCountUp(value)}{suffix}</>
}

export function Gauge({ pct = 0, label = 'Complete' }) {
  const shown = useCountUp(pct)
  const total = 2 * Math.PI * 80 // ~502.65
  const [off, setOff] = useState(total)
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = total - (total * pct) / 100
    if (reduce) { setOff(target); return }
    const id = setTimeout(() => setOff(target), 200)
    return () => clearTimeout(id)
  }, [pct, total])
  return (
    <div className="dialwrap">
      <svg viewBox="0 0 186 186" aria-hidden="true">
        <circle cx="93" cy="93" r="80" fill="none" stroke="var(--track)" strokeWidth="7" />
        <circle className="dial-fg" cx="93" cy="93" r="80" fill="none" stroke="url(#gg)"
          strokeWidth="9" strokeLinecap="round" strokeDasharray={total} strokeDashoffset={off} />
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2F7BF6" />
            <stop offset="0.55" stopColor="#33C6E0" />
            <stop offset="1" stopColor="#45D69A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="disc"><div><b>{shown}%</b><span>{label}</span></div></div>
    </div>
  )
}

export function Sparkline({ values = [], height = 110 }) {
  const W = 320, H = 110, pad = 14, max = 100
  const pts = values.map((v, i) => [
    pad + i * ((W - 2 * pad) / (values.length - 1)),
    H - 12 - (v / max) * (H - 30),
  ])
  const d = (p) => {
    let s = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
      s += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
    }
    return s
  }
  const line = d(pts)
  const area = `${line}L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`
  const tip = pts[pts.length - 1] || [0, 0]
  return (
    <svg viewBox="0 0 320 110" width="100%" height={height} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3FA6EE" stopOpacity="0.34" />
          <stop offset="1" stopColor="#45D69A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ls" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2F7BF6" />
          <stop offset="0.6" stopColor="#33C6E0" />
          <stop offset="1" stopColor="#45D69A" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#af)" />
      <path d={line} fill="none" stroke="url(#ls)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={tip[0]} cy={tip[1]} r="5.5" fill="#fff" stroke="#2F7BF6" strokeWidth="3" />
    </svg>
  )
}
