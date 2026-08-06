import * as React from 'react'
import { cn } from '@/lib/utils'
import { GlassSurface } from './glass-surface.jsx'

// GlassCard — inherits the single GlassSurface material
export const Card = React.forwardRef(function Card({ className, variant = 'card', interactive = false, ...props }, ref) {
  return <GlassSurface ref={ref} variant={variant} interactive={interactive} className={className} {...props} />
})
Card.displayName = 'Card'

export const CardHeader = ({ className, ...props }) => <div className={cn('flex flex-col gap-1 p-5', className)} {...props} />
export const CardTitle = ({ className, ...props }) => <h3 className={cn('text-base font-semibold tracking-tight text-white', className)} {...props} />
export const CardDescription = ({ className, ...props }) => <p className={cn('text-sm text-[hsl(var(--muted-foreground))]', className)} {...props} />
export const CardContent = ({ className, ...props }) => <div className={cn('p-5 pt-0', className)} {...props} />
export const CardFooter = ({ className, ...props }) => <div className={cn('flex items-center p-5 pt-0', className)} {...props} />
