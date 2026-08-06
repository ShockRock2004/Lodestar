import * as React from 'react'
import { cn } from '@/lib/utils'
export { GlassFilter } from './liquid-glass-button.jsx'

/**
 * GlassMaterial — the single optical material (from the LiquidButton): layered
 * edge/inner-glow shadow + #container-glass refraction + highlight + noise.
 * Real children render above the material and keep normal flow, so consumer
 * layout classes (flex, padding, grid) apply exactly as on a plain element.
 */
export const GlassSurface = React.forwardRef(function GlassSurface(
  { as: Comp = 'div', variant = 'card', interactive = false, className, children, ...props },
  ref,
) {
  return (
    <Comp
      ref={ref}
      data-glass={variant}
      {...(interactive ? { 'data-interactive': '' } : {})}
      className={cn('glass', className)}
      {...props}
    >
      {['card','focus','subject','soft','panel'].includes(variant) && <span className="cg-glow" aria-hidden="true" />}
      <span className="glass__refract" aria-hidden="true" />
      <span className="glass__shadow" aria-hidden="true" />
      <span className="glass__tint" aria-hidden="true" />
      {children}
    </Comp>
  )
})
