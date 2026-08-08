'use client'

// Taskbar battery reading, styled after the little tray battery meter on old
// ThinkPads running Win98 (percentage next to a beveled battery glyph, sat
// right next to the clock). Backed by the real Battery Status API
// (navigator.getBattery()) — not every browser still ships it (Firefox and
// Safari dropped it for fingerprinting reasons, and it's desktop-Chrome-only
// even where it exists), so this renders nothing at all rather than a fake
// reading when it's unavailable, same fail-soft approach as the rest of the
// site's live-data widgets.

import { useEffect, useState } from 'react'

// Not in lib.dom.d.ts — the Battery Status API was pulled from the spec
// track, so TypeScript's DOM types never picked it up.
type BatteryManager = {
  level: number
  charging: boolean
  addEventListener: (type: 'levelchange' | 'chargingchange', listener: () => void) => void
  removeEventListener: (type: 'levelchange' | 'chargingchange', listener: () => void) => void
}

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManager>
}

function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  // Outer body is 16x10 with a 1px border; inner fill area is inset by 2px
  // on each side (12x6), plus a small nub on the right — the standard
  // battery-glyph silhouette, kept hard-edged (no rounded corners) to match
  // the rest of the site's pixel-art icons rather than a modern rounded one.
  const fillWidth = Math.max(0, Math.min(12, (level / 100) * 12))
  return (
    <svg width="20" height="11" viewBox="0 0 20 11" aria-hidden="true">
      <rect x="0.5" y="0.5" width="16" height="10" fill="none" stroke="black" strokeWidth="1" />
      <rect x="17" y="3" width="2" height="4" fill="black" />
      <rect x="2" y="2" width="12" height="6" fill="white" />
      <rect x="2" y="2" width={fillWidth} height="6" fill="black" />
      {charging && (
        <path d="M 9.5 1.5 L 6 6 L 8.5 6 L 7 9.5 L 11.5 4.5 L 9 4.5 Z" fill="white" stroke="black" strokeWidth="0.5" />
      )}
    </svg>
  )
}

export default function BatteryIndicator() {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null)

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery
    if (!nav.getBattery) return

    let manager: BatteryManager | null = null
    let cancelled = false

    const sync = () => {
      if (manager) setBattery({ level: manager.level * 100, charging: manager.charging })
    }

    nav.getBattery().then((b) => {
      if (cancelled) return
      manager = b
      sync()
      manager.addEventListener('levelchange', sync)
      manager.addEventListener('chargingchange', sync)
    })

    return () => {
      cancelled = true
      manager?.removeEventListener('levelchange', sync)
      manager?.removeEventListener('chargingchange', sync)
    }
  }, [])

  if (!battery) return null

  // No wrapping box here on purpose — the caller (FooterConsole) renders
  // this inline inside the same win98-taskbar-time box as the clock, so
  // battery and time share one sunken tray instead of two side by side.
  return (
    <span className="flex items-center gap-1.5">
      <BatteryIcon level={battery.level} charging={battery.charging} />
      <span className="text-xs whitespace-nowrap">{Math.round(battery.level)}%</span>
    </span>
  )
}
