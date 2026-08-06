import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '../../lib/utils.js'

// Magic UI — Dock (macOS-style magnification, Framer Motion)
export function Dock({ children, className, magnification = 64, distance = 140 }) {
  const mouseX = useMotionValue(Infinity)
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        'glass-dock-bar mx-auto flex h-[68px] items-end gap-2 rounded-[26px] px-3 pb-3',
        className,
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { mouseX, magnification, distance })
          : child,
      )}
    </motion.div>
  )
}

export function DockIcon({ mouseX, magnification = 64, distance = 140, className, children, ...props }) {
  const ref = useRef(null)
  const dist = useTransform(mouseX, (val) => {
    const b = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - b.x - b.width / 2
  })
  const sizeSync = useTransform(dist, [-distance, 0, distance], [44, magnification, 44])
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 150, damping: 12 })
  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      className={cn('flex aspect-square items-center justify-center rounded-2xl', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
