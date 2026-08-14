'use client'

// App-launch splash, shown briefly the first time an app opens in a
// session (see openApp in HomeClient.tsx). Per-app: the titlebar and body
// both use that app's own icon, and the message is app-specific (see
// LOADING_MESSAGES in HomeClient.tsx) — reads as "this app is starting",
// not a generic system dialog reused for everything.
//
// The progress indicator is a sunken track with a block of color sweeping
// back and forth, rather than a spinning circle — win98 "please wait"
// dialogs (installers, app splashes) used exactly this marquee-style bar,
// a spinning circle is more a 2000s-and-on web convention than a win98 one.
//
// `glitch` (advith.exe only — see HomeClient.tsx) swaps the calm pop-in for
// a continuous jittery shake + RGB-split text flicker + a faster, steppy
// (rather than smooth) marquee tinted to match the faulty-terminal
// backdrop's teal — reads as "hacker disruption" instead of a normal app
// opening, fitting for the one app with that backdrop.
//
// `left`/`top` (percent of viewport, defaults to dead-center) let a caller
// scatter several of these across the screen instead of stacking them all
// in the same spot — see advith.exe's multi-spawn glitch open sequence in
// HomeClient's openApp.

import Image from 'next/image'

type WindowsLoaderProps = {
  /** Titlebar text, e.g. "Loading Minesweeper..." */
  title: string
  /** The app's own icon — used in both the titlebar and the body. */
  icon: string
  /** Per-app flavor text, e.g. "Sweeping for mines..." */
  message: string
  /** Distorted "hacker disruption" styling instead of the normal calm
   *  pop-in. Defaults to false — every app besides advith.exe. */
  glitch?: boolean
  /** Position as % of viewport width/height — the card is still centered
   *  on that point via the translate transform below. Defaults to 50/50
   *  (dead-center), same as every non-advith app's splash. */
  left?: number
  top?: number
}

export default function WindowsLoader({ title, icon, message, glitch = false, left = 50, top = 50 }: WindowsLoaderProps) {
  return (
    <div
      className={`win98-window fixed -translate-x-1/2 -translate-y-1/2 w-72 ${
        glitch ? 'win98-loader-glitch' : 'win98-loader-pop'
      }`}
      style={{ zIndex: 20000, left: `${left}%`, top: `${top}%` }}
    >
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <Image src={icon} alt="" width={16} height={16} className="w-4 h-4 object-contain" />
          <span className={glitch ? 'win98-glitch-text' : undefined}>{title}</span>
        </div>
      </div>
      <div className="p-4 bg-[#c0c0c0] flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Image
            src={icon}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 object-contain shrink-0"
          />
          {/* min-w-0 lets this wrap instead of squeezing the icon into an
              oval — same reasoning as the old single-app version of this
              component. */}
          <span className={`min-w-0 text-sm leading-snug ${glitch ? 'win98-glitch-text' : ''}`}>
            {message}
          </span>
        </div>
        {/* Sunken track (dark top/left, light bottom/right — the inverse of
            a raised win98-button) with a marquee block sweeping across it. */}
        <div className="h-4 bg-white border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white overflow-hidden">
          <div
            className={`h-full w-1/3 ${glitch ? 'bg-[#2baca4] win98-loader-marquee-glitch' : 'bg-[#000080] win98-loader-marquee'}`}
          />
        </div>
      </div>
    </div>
  )
}
