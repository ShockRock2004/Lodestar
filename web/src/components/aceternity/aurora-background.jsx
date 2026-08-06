import { cn } from '../../lib/utils.js'

// Aceternity-style aurora background (flowing gradient over a dark stage)
export function AuroraBackground({ children, className }) {
  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]', className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-flow" />
        <div className="aurora-orb aurora-orb--blue" />
        <div className="aurora-orb aurora-orb--violet" />
        <div className="aurora-orb aurora-orb--teal" />
        <div className="aurora-grain" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
