// Aceternity GlowingEffect driver (vanilla): points --start at the cursor and
// flips --active near a card's edge; dead-zone in the middle keeps it an edge affordance.
export function initGlow() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  let raf = 0, mx = -9999, my = -9999
  const update = () => {
    raf = 0
    document.querySelectorAll('.cg-glow').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (!r.width) return
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const dead = 0.5 * Math.min(r.width, r.height) * 0.55
      const prox = 52
      const inside = mx >= r.left - prox && mx <= r.right + prox && my >= r.top - prox && my <= r.bottom + prox
      if (!inside || Math.hypot(mx - cx, my - cy) < dead) { el.style.setProperty('--active', '0'); return }
      el.style.setProperty('--active', '1')
      el.style.setProperty('--start', String((Math.atan2(mx - cx, -(my - cy)) * 180) / Math.PI))
    })
  }
  const onMove = (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(update) }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('scroll', onScroll) }
}
