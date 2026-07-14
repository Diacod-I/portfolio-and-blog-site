'use client'

// Billboard-style "hover to reveal" text: clipped to one line with an
// ellipsis at rest, and on hover scrolls left just far enough to bring the
// clipped end into view — same effect as the hover-scroll on long chat
// titles in Claude's own sidebar. Scroll speed is constant (not a fixed
// duration), so a barely-clipped title nudges over quickly while a very
// long one takes proportionally longer. Un-hovering always snaps back at a
// fixed, quick pace regardless of how far it had scrolled, rather than
// mirroring the (potentially much slower) reveal speed.
//
// `hovered` is driven by the caller rather than a CSS `group-hover`
// pseudo-class, specifically so the forward and return transitions can use
// two different durations.

import { useLayoutEffect, useRef, useState } from 'react'

const PX_PER_SECOND = 80
const RETURN_DURATION_S = 0.2

type MarqueeTextProps = {
  text: string
  hovered: boolean
  className?: string
}

export default function MarqueeText({ text, hovered, className = '' }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(0)

  useLayoutEffect(() => {
    const container = containerRef.current
    const inner = textRef.current
    if (!container || !inner) return
    const measure = () => {
      setOverflow(Math.max(0, Math.ceil(inner.scrollWidth - container.clientWidth)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
    // Re-measure if the text itself changes (e.g. a different note).
  }, [text])

  const canScroll = overflow > 0
  const active = canScroll && hovered
  const forwardDuration = overflow / PX_PER_SECOND

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap min-w-0 ${className}`}>
      <span
        ref={textRef}
        className="inline-block transition-transform ease-linear"
        style={{
          transform: active ? `translateX(-${overflow}px)` : 'translateX(0)',
          transitionDuration: `${active ? forwardDuration : RETURN_DURATION_S}s`,
        }}
      >
        {text}
      </span>
    </div>
  )
}
