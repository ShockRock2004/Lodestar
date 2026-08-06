import { motion, useReducedMotion } from 'framer-motion'

// Scroll-reveal wrapper — mirrors the CryptGen template's whileInView entrance
// (fade + rise + faint scale). once:true guarantees content ends visible.
export default function Reveal({ children, className, delay = 0, y = 18, as = 'div' }) {
  const rm = useReducedMotion()
  if (rm) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }
  const M = motion[as] || motion.div
  return (
    <M
      className={className}
      initial={{ opacity: 0, y, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </M>
  )
}
