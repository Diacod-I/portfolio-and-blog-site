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

import { useEffect, useRef, useState } from 'react'

type PrinceOfPersiaWindowProps = {
  onOpenControls: () => void
}

const GAME_URL = 'https://archive.org/embed/msdos_Prince_of_Persia_1990'

export default function PrinceOfPersiaWindow({ onOpenControls }: PrinceOfPersiaWindowProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [gameFocused, setGameFocused] = useState(false)

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

  return (
    <div className="flex-1 min-h-0 bg-black flex flex-col">
      <div className="relative flex-1 min-h-0">
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
              Gives the game your keyboard. Clicking anything outside this
              screen (like the Controls button) will bring this back — just
              click here again to keep playing.
            </span>
          </button>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center justify-between gap-2 bg-[#c0c0c0] px-2 py-1 border-t-2 border-[#808080]">
        <button
          onClick={onOpenControls}
          className="win98-button px-2 py-0.5 text-xs font-bold text-black flex-shrink-0"
        >
          📝 Controls
        </button>
      </div>
    </div>
  )
}
