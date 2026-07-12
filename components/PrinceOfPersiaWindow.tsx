'use client'

// Prince of Persia (1990, Broderbund / Jordan Mechner), running via
// archive.org's in-browser DOSBox embed — replaced the Doom app entirely
// after Doom's default Fire key (Ctrl, or left mouse button) turned out
// unreliable in Mac browsers across every embed tried. Prince of Persia's
// whole control scheme is arrows + Shift (no Ctrl at all — see
// PrinceOfPersiaReadmeWindow.tsx), which sidesteps that problem.
//
// archive.org only (dos.zone dropped — been down). This specific item
// (msdos_Prince_of_Persia_1990) is marked "Access-restricted-item" in its
// own metadata — archive.org's Controlled Digital Lending model, unlike
// Doom's shareware episode which had no such restriction — so it may
// prompt to borrow/sign in instead of just playing.
//
// The click-to-focus overlay and pointer-lock permission below are
// unchanged from the Doom version — this is still a cross-origin iframe
// with the same focus-handoff and mouse-capture mechanics.
//
// Small pillarboxed canvas by default: confirmed (by comparing against
// archive.org's own details page) that this is archive.org's normal
// presentation for this item, not something our iframe embedding broke —
// their player renders the game at its native size with black bars around
// it, and expects you to use their own "fullscreen view" control to get a
// properly scaled view. That control lives inside their (cross-origin) page
// so we can't click it for the user, but requestFullscreen() is a method on
// *our* <iframe> element itself — calling it from here isn't blocked by
// cross-origin restrictions, and entering fullscreen resizes the iframe's
// content area, which archive.org's own player picks up and rescales
// against. So a fullscreen button of our own (below) sidesteps the need to
// find/click their internal control at all.
//
// Once real DOS emulation starts (post "Click to play"), the rendered game
// canvas sits at a fixed pixel size *pinned to the iframe's top-left corner*
// — confirmed this doesn't change with iframe size, so we can't make the
// canvas itself bigger or centered (that's inside a cross-origin document).
// What we *can* control is the size and position of the iframe box itself:
// instead of stretching it to fill the whole window (which just adds more
// empty space around a canvas that won't grow to match), cap it to roughly
// the game's own aspect ratio and center that box in the window. The
// pillarboxing inside the iframe itself is still there, but it's now a
// small margin around a centered box instead of a small canvas glued to one
// corner of a huge black window.

import { useEffect, useRef, useState } from 'react'

type PrinceOfPersiaWindowProps = {
  onOpenControls: () => void
}

const GAME_URL = 'https://archive.org/embed/msdos_Prince_of_Persia_1990'

export default function PrinceOfPersiaWindow({ onOpenControls }: PrinceOfPersiaWindowProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [gameFocused, setGameFocused] = useState(false)
  // Keyboard-only game (arrows + Shift, no touch input at all — see
  // PrinceOfPersiaReadmeWindow.tsx) — unplayable on a phone. Skip loading
  // the DOSBox iframe entirely below this breakpoint and show a "desktop
  // only" notice instead, rather than a game nobody can control. Same
  // <640px matchMedia pattern SubstackToast uses for its own small-screen
  // check.
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const recheckFocus = () => {
      // Focus changes land on the iframe element itself a tick after the
      // browser event fires, not synchronously with it.
      setTimeout(() => {
        setGameFocused(document.activeElement === iframeRef.current)
      }, 0)
    }
    window.addEventListener('blur', recheckFocus)
    window.addEventListener('focus', recheckFocus)
    return () => {
      window.removeEventListener('blur', recheckFocus)
      window.removeEventListener('focus', recheckFocus)
    }
  }, [])

  const focusGame = () => {
    iframeRef.current?.focus()
    setGameFocused(true)
  }

  const goFullscreen = () => {
    const el = iframeRef.current
    if (!el) return
    // Vendor-prefixed fallback for older Safari, same pattern as any other
    // Fullscreen API call.
    const request =
      el.requestFullscreen ||
      (el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen
    request?.call(el)
    focusGame()
  }

  return (
    <div className="flex-1 min-h-0 bg-black flex flex-col">
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        {isMobile ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#c0c0c0] text-black text-sm text-center px-6">
            <span className="text-3xl">🖥️</span>
            <span className="font-bold">Desktop only</span>
            <span className="text-xs max-w-xs text-gray-700">
              Prince of Persia is played entirely with a keyboard (arrow
              keys + Shift) — there&apos;s no touch controls. Open this site
              on a desktop or laptop to play.
            </span>
          </div>
        ) : (
          // Fixed pixel box (not aspect-ratio + max-h together — that
          // combination inside a flex-centered parent landed a few px off
          // dead-center in testing) roughly matching the game's own
          // rendered size, capped down for narrow windows. See the comment
          // above for why: the canvas inside won't grow past its fixed size
          // regardless of the iframe's box, so a smaller centered box beats
          // a huge one with the game glued to a corner.
          <div className="relative w-[640px] h-[400px] max-w-full max-h-full">
            <iframe
              ref={iframeRef}
              src={GAME_URL}
              title="Prince of Persia (1990) — via archive.org"
              className="w-full h-full border-0"
              allow="fullscreen; pointer-lock"
              allowFullScreen
            />
            {!gameFocused && (
              <button
                onClick={focusGame}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white text-sm font-bold text-center px-4"
              >
                <span>▶ Click to play</span>
                <span className="text-xs font-normal text-[#cccccc] max-w-xs">
                  Gives the game your keyboard. Clicking anything outside
                  this screen (like the Controls button) will bring this
                  back — just click here again to keep playing.
                </span>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center justify-between gap-2 bg-[#c0c0c0] px-2 py-1 border-t-2 border-[#808080]">
        <button
          onClick={onOpenControls}
          className="win98-button px-2 py-0.5 text-xs font-bold text-black flex-shrink-0"
        >
          📝 Controls - Read before playing
        </button>
      </div>
    </div>
  )
}
