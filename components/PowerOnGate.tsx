'use client'

// "Click to power on" gate for a cold landing on '/' — see AppShellHost.tsx
// for exactly when this renders (only when '/' is the very first route this
// session, not on every visit to '/' — navigating back to '/' later via the
// nav bar doesn't re-trigger it, since that click already satisfies the
// browser gesture requirement below on its own).
//
// Why this exists at all: browsers block any audio.play()/AudioContext call
// that isn't triggered directly inside a real user gesture (click, tap,
// keydown) until the page has seen at least one such gesture — see
// SoundEffects.tsx's own long comment on this. HomeClient's Home tab starts
// typing its "$ >" query (and playing a keystroke sound per character, plus
// a boot log, plus a "dossier ready" chime) automatically the moment
// advith.exe is open — which, on a cold '/' load with no persisted window
// state, requires a click on its desktop icon first (already a real
// gesture, so this isn't usually a problem) — but sessionStorage persists
// window state (see windowStore.ts's persist middleware), so a *reload* of
// '/' with advith.exe already marked open from an earlier visit this
// session replays that whole sequence immediately, with zero gesture yet
// in this fresh page load. Every one of those sounds silently fails.
//
// Rather than special-casing that one scenario, this gates the entire
// first '/' landing behind one explicit click (or keypress) before
// HomeClient mounts at all — simpler than trying to detect "is a sound
// about to autoplay" case by case, and it guarantees every sound effect on
// the site works from the very first real interaction onward, not just
// after the user happens to click something that matches SoundEffects.tsx's
// own selector. HomeClient isn't mounted underneath this at all (see
// AppShellHost.tsx) while the gate is up — nothing wasted rendering behind
// an opaque full-screen overlay nobody's seen yet.
//
// Deliberately styled as a BIOS/DOS-style boot prompt (black screen,
// monospace, green-on-black) rather than a win98 dialog — this is the one
// moment on the site that's "before" the win98 desktop even exists yet,
// so it reads as the boot stage that precedes it, not a dialog box floating
// on top of one.
import { useEffect } from 'react'

type PowerOnGateProps = {
  onStart: () => void
}

export default function PowerOnGate({ onStart }: PowerOnGateProps) {
  useEffect(() => {
    // "Press any key" per the BIOS-prompt convention this is styled after
    // — layered on top of the real <button> below (which already handles
    // click/Enter/Space on its own via native button semantics), so this
    // is purely an extra affordance, not the only way to proceed. Any
    // keydown at all (not just Enter/Space) dismisses, matching what an
    // actual "press any key to continue" prompt does.
    const onKeyDown = () => onStart()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onStart])

  return (
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center gap-6 font-mono text-[#00FF00] select-none px-4">
      <div className="flex flex-col items-center gap-3">
        <p className="text-base sm:text-lg tracking-[0.2em]">ADVITH-OS</p>
        <p className="text-[10px] sm:text-xs text-[#00aa00] max-w-xs text-center leading-relaxed">
          Sound is disabled until you interact with the page — click below (or
          press any key) to boot up with sound enabled.
        </p>
      </div>
      {/* A real <button>, not a styled div — Enter/Space work for free via
          native button semantics, and it matches SoundEffects.tsx's own
          INTERACTIVE_SELECTOR (button, ...), so this exact click also
          produces the site's normal click sound the instant audio unlocks
          — a small, fitting confirmation that sound just turned on. */}
      <button
        type="button"
        onClick={onStart}
        autoFocus
        className="text-xs sm:text-sm text-[#00FF00] border border-[#00FF00] px-5 py-2.5 hover:bg-[#00FF00] hover:text-black transition-colors"
      >
        Click or press any key to start
        <span
          className="inline-block w-2 h-4 bg-[#00FF00] align-middle ml-2 animate-pulse"
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
