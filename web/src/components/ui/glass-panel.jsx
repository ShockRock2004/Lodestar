import { GlassSurface } from './glass-surface.jsx'

// GlassPanel — larger container surface (dialogs/sheets/sections) from the one material
export function GlassPanel({ variant = 'panel', className, children, ...props }) {
  return (
    <GlassSurface variant={variant} className={className} {...props}>
      {children}
    </GlassSurface>
  )
}
