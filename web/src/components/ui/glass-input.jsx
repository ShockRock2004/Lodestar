import * as React from 'react'
import { cn } from '@/lib/utils'
import { GlassSurface } from './glass-surface.jsx'

export const GlassInput = React.forwardRef(function GlassInput({ className, ...props }, ref) {
  return (
    <GlassSurface variant="input" className="w-full">
      <input ref={ref}
        className={cn('w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none', className)}
        {...props} />
    </GlassSurface>
  )
})
