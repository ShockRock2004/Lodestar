import { useCallback, useEffect, useRef, useState } from 'react'

// Horizontal pager built on CSS scroll-snap rather than a drag library: touch swipe,
// trackpad swipe and momentum all come from the platform for free, and it degrades to
// a plain scroller if JS motion is off. Arrows + dots + arrow keys cover pointer and
// keyboard users, so swiping is never the only way to reach a page.
export default function SwipeDeck({ pages, label = 'Card deck', className = '' }) {
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)

  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const w = el.clientWidth || 1
    const next = Math.round(el.scrollLeft / w)
    setIdx((cur) => (cur === next ? cur : Math.max(0, Math.min(pages.length - 1, next))))
  }, [pages.length])

  const goTo = useCallback((i) => {
    const el = ref.current
    if (!el) return
    const n = Math.max(0, Math.min(pages.length - 1, i))
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
  }, [pages.length])

  // Keep the snapped page pinned when the viewport resizes, otherwise a rotation
  // or window drag leaves the deck stranded between two pages.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => { el.scrollLeft = idx * el.clientWidth })
    ro.observe(el)
    return () => ro.disconnect()
  }, [idx])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(idx - 1) }
  }

  return (
    <div className={'deck ' + className} role="group" aria-roledescription="carousel" aria-label={label}>
      {/* Every page is stretched to the tallest one, so swiping never resizes the
          page under the cursor. Each page fills that height with its own card. */}
      <div ref={ref} className="deck-viewport" onScroll={onScroll} onKeyDown={onKeyDown} tabIndex={0}
        aria-live="polite">
        {pages.map((p, i) => (
          <section key={p.key} className="deck-page" aria-roledescription="slide"
            aria-label={`${p.label} — ${i + 1} of ${pages.length}`} aria-hidden={i !== idx}>
            {p.node}
          </section>
        ))}
      </div>

      <div className="deck-bar">
        <button type="button" className="deck-arrow" onClick={() => goTo(idx - 1)} disabled={idx === 0}
          aria-label="Previous page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div className="deck-dots">
          {pages.map((p, i) => (
            <button key={p.key} type="button" onClick={() => goTo(i)}
              className={'deck-dot' + (i === idx ? ' is-on' : '')}
              aria-label={`Go to ${p.label}`} aria-current={i === idx ? 'true' : undefined}>
              <span className="deck-dot-hit" />
              <span className="deck-dot-mark" />
            </button>
          ))}
        </div>
        <span className="deck-label">{pages[idx] ? pages[idx].label : ''}</span>
        <button type="button" className="deck-arrow" onClick={() => goTo(idx + 1)} disabled={idx === pages.length - 1}
          aria-label="Next page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  )
}
