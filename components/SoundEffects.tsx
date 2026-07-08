'use client'

import { useEffect, useRef } from 'react'

const CLICK_SOUND_SRC = '/win98/click.mp3'
const INTERACTIVE_SELECTOR =
  'button, a[href], [role="button"], input[type="button"], input[type="submit"]'

// Mounted once in the root layout (see app/layout.tsx). Two jobs:
//
//  1. Plays a short synthesized click on every real UI interaction —
//     buttons, links, desktop icons, taskbar, window controls — the
//     classic "clack" of an old PC UI.
//
//  2. As a side effect of #1: every click anywhere on the site is now a
//     genuine user-gesture audio.play() call. Browsers require at least one
//     of those before they'll allow ANY later unprompted audio playback
//     (e.g. the 404 page's error chime trying to autoplay on arrival) — see
//     ErrorWindow.tsx. There's no way to skip that requirement from JS, but
//     once it's satisfied once, most browsers keep the tab "unlocked" for
//     the rest of its life. So in practice, as long as the user has clicked
//     one thing on the site before landing on a 404 (extremely common —
//     e.g. clicking a broken in-app link), the error sound will already
//     play immediately without needing a second click on the 404 page
//     itself.
export default function SoundEffects() {
  const poolRef = useRef<HTMLAudioElement[]>([])
  const poolIndexRef = useRef(0)

  useEffect(() => {
    // A small rotating pool (not one shared Audio, not a new one per click):
    // rapid clicks don't cut each other's playback off, and we're not
    // leaking a new element into memory on every click either.
    const POOL_SIZE = 4
    poolRef.current = Array.from({ length: POOL_SIZE }, () => new Audio(CLICK_SOUND_SRC))

    const playClick = () => {
      const pool = poolRef.current
      const audio = pool[poolIndexRef.current]
      poolIndexRef.current = (poolIndexRef.current + 1) % pool.length
      audio.currentTime = 0
      audio.play().catch(() => { /* blocked until the first real gesture — this call IS one */ })
    }

    // pointerdown (not click) so the sound lands the instant a button is
    // pressed, same as real Windows — not delayed until release.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest(INTERACTIVE_SELECTOR)) playClick()
    }

    document.addEventListener('pointerdown', onPointerDown, { capture: true })
    return () => document.removeEventListener('pointerdown', onPointerDown, { capture: true })
  }, [])

  return null
}
