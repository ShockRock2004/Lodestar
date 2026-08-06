import { LiquidButton } from './liquid-glass-button.jsx'

// GlassButton — the exact LiquidButton material
export function GlassButton({ size = 'default', className, children, ...props }) {
  return (
    <LiquidButton size={size} className={className} {...props}>
      {children}
    </LiquidButton>
  )
}
