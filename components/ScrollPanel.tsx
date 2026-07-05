'use client'

// Scrollable panel with three affordances so visitors know there's more:
//  1. Always-visible win98 scrollbar (webkit styles in globals.css,
//     Firefox via scrollbar-width/color inline below).
//  2. A bottom "scroll shadow" that disappears when scrolled to the end.
//  3. A one-time nudge animation when the panel first enters the viewport.
// Nudge respects prefers-reduced-motion and runs once per session.

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

type ScrollPanelProps = {
  children: React.ReactNode
  maxHeight: number
  className?: string
  /** sessionStorage key so multiple panels nudge independently */
  nudgeId?: string
}

export default function ScrollPanel({
  children,
  maxHeight,
  className = '',
  nudgeId = 'scroll-panel',
}: ScrollPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showShadow, setShowShadow] = useState(false)
  const [shouldNudge, setShouldNudge] = useState(false)
  const inView = useInView(scrollRef, { once: true, amount: 0.4 })
  const prefersReducedMotion = useReducedMotion()

  const updateShadow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const scrollable = el.scrollHeight > el.clientHeight
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
    setShowShadow(scrollable && !atBottom)
  }, [])

  // Re-check when content or size changes
  useEffect(() => {
    updateShadow()
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(updateShadow)
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateShadow, children])

  // One-time nudge when scrollable panel first becomes visible
  useEffect(() => {
    if (!inView || prefersReducedMotion) return
    const el = scrollRef.current
    if (!el || el.scrollHeight <= el.clientHeight) return
    const key = `nudged:${nudgeId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    setShouldNudge(true)
  }, [inView, prefersReducedMotion, nudgeId])

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        onScroll={updateShadow}
        className="overflow-y-auto"
        style={{
          maxHeight,
          // Firefox equivalent of the webkit win98 scrollbar styling
          scrollbarWidth: 'auto',
          scrollbarColor: '#dfdfdf #c0c0c0',
        }}
      >
        <motion.div
          animate={shouldNudge ? { y: [0, -10, 0, -6, 0] } : undefined}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          onAnimationComplete={() => setShouldNudge(false)}
        >
          {children}
        </motion.div>
      </div>
      {/* Bottom scroll shadow: "there's more below" */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-6 transition-opacity duration-200"
        style={{
          opacity: showShadow ? 1 : 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.28))',
        }}
      />
    </div>
  )
}
