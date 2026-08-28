'use client'

// "Boot menu" gate for a cold landing on '/' — see AppShellHost.tsx for
// exactly when this renders (only when '/' is the very first route this
// session, not on every visit to '/' — navigating back to '/' later via
// the nav bar doesn't re-trigger it, since that click already satisfies
// the browser gesture requirement below on its own).
//
// Why this exists at all: browsers block any audio.play()/AudioContext
// call that isn't triggered directly inside a real user gesture (click,
// tap, keydown) until the page has seen at least one such gesture — see
// SoundEffects.tsx's own long comment on this. HomeClient's Home tab
// starts typing its "$ >" query (and playing a keystroke sound per
// character, plus a boot log, plus a "dossier ready" chime) automatically
// the moment advith.exe is open — which, on a cold '/' load with no
// persisted window state, requires a click on its desktop icon first
// (already a real gesture, so this isn't usually a problem) — but
// sessionStorage persists window state (see windowStore.ts's persist
// middleware), so a *reload* of '/' with advith.exe already marked open
// from an earlier visit this session replays that whole sequence
// immediately, with zero gesture yet in this fresh page load. Every one
// of those sounds silently fails.
//
// Rather than special-casing that one scenario, this gates the entire
// first '/' landing behind one explicit selection before HomeClient
// mounts at all — simpler than trying to detect "is a sound about to
// autoplay" case by case, and it guarantees every sound effect on the
// site works from the very first real interaction onward.
//
// Styled to match the real GRUB2 boot menu as closely as CSS reasonably
// allows (see the 'menu' phase's own comment below for the specifics) —
// per feedback, a generic "click to enable sound" dialog didn't read as
// "an actual operating system starting up" the way an actual bootloader
// screen does, and it's the one moment on the site that's genuinely
// "before" the win98 desktop exists yet. Two phases:
//   'menu'    — black screen, one selectable menu entry, nothing else.
//   'booting' — plays a synthesized startup chime (same one-off-
//               AudioContext pattern as Minesweeper's explosion — see
//               that file — rather than the reused-context pattern
//               HomeClient's playTypeSound uses, since this only ever
//               fires once per session) while the real desktop wallpaper
//               fades in from behind a black overlay — echoing a real OS
//               boot (chime + splash fading to the desktop). Once the
//               fade finishes, onStart() fires and this component
//               unmounts for good, handing off to the real HomeClient
//               (which renders that exact same wallpaper — see its own
//               backgroundImage — so there's no visual jump at handoff).
import { useEffect, useState } from 'react'

type PowerOnGateProps = {
  onStart: () => void
}

// How long the wallpaper-reveal fade takes once the entry is selected —
// onStart() fires this long after, not immediately, so the fade is
// actually visible before HomeClient takes over.
const BOOT_FADE_MS = 1600

// Warm ascending major chord (C4/E4/G4/C5), synthesized rather than a
// recorded sample — same reasoning and technique as Minesweeper's
// playExplosion and Solitaire's win chime (see those files): no asset to
// license or ship, and this only ever plays once per session so a fresh
// one-off AudioContext (not a reused one) is the right call here, unlike
// the rapid-fire keystroke sound above which reuses a single context.
function playBootChime() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(0, now)
    master.gain.linearRampToValueAtTime(0.16, now + 0.2)
    master.gain.exponentialRampToValueAtTime(0.001, now + 1.8)
    master.connect(ctx.destination)
    ;[261.63, 329.63, 392.0, 523.25].forEach((freq) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      osc.connect(master)
      osc.start(now)
      osc.stop(now + 1.9)
    })
  } catch {
    /* Web Audio unavailable — this call IS the unlocking gesture, so it
       shouldn't normally be blocked, but lose silently either way. */
  }
}

export default function PowerOnGate({ onStart }: PowerOnGateProps) {
  const [phase, setPhase] = useState<'menu' | 'booting'>('menu')
  // Starts true (opaque black, hiding the wallpaper beneath) and flips to
  // false one frame after entering 'booting' — the delay is what makes
  // the opacity change an actual observed transition instead of skipping
  // straight to its end state before the browser paints the start of it.
  const [fadeOut, setFadeOut] = useState(false)

  const handleSelect = () => {
    if (phase !== 'menu') return
    playBootChime()
    setPhase('booting')
  }

  useEffect(() => {
    if (phase !== 'booting') return
    const raf = requestAnimationFrame(() => setFadeOut(true))
    const toStart = setTimeout(onStart, BOOT_FADE_MS)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(toStart)
    }
  }, [phase, onStart])

  return (
    <div className="fixed inset-0 z-[99999] bg-black">
      {/* Real desktop wallpaper, revealed as the black overlay below
          fades out — same image/sizing HomeClient uses for the actual
          desktop, so the handoff at onStart() is seamless. Only rendered
          once booting starts; no reason to pay for it during 'menu'. */}
      {phase === 'booting' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/win98/windows_98_wallpaper.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div
        className="absolute inset-0 bg-black transition-opacity ease-out"
        style={{ opacity: fadeOut ? 0 : 1, transitionDuration: `${BOOT_FADE_MS}ms` }}
      />
      {phase === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[#c0c0c0] select-none px-4">
          {/* Laid out to match real GRUB2's default text menu as closely
              as CSS reasonably allows: "GNU GRUB  version X.XX" above a
              bordered box, the one real entry highlighted with a static
              (not blinking — real GRUB doesn't blink its selection)
              inverted bar, and the box padded out with blank rows to the
              same tall, mostly-empty shape GRUB's box has even with only
              one or two entries installed, followed by the exact
              "Use the arrow keys..." instructions GRUB itself shows. See
              CreditsWindow.tsx's Design & Inspiration section for the
              trademark note this borrows the same disclosure pattern
              from (the Windows 98 homage above it). */}
          <div className="w-full max-w-xl">
            <p className="text-sm sm:text-base mb-2">GNU GRUB&nbsp;&nbsp;version 2.06</p>
            <div className="border border-[#c0c0c0]">
              {/* A real <button>, not a styled div — native Enter/Space
                  handling for free, and it matches SoundEffects.tsx's own
                  INTERACTIVE_SELECTOR (button, ...), so selecting it also
                  produces the site's normal click sound right alongside
                  the boot chime above. */}
              <button
                type="button"
                onClick={handleSelect}
                autoFocus
                className="w-full text-left px-3 py-1 text-sm sm:text-base bg-[#c0c0c0] text-black"
              >
                Advith-OS
              </button>
              {/* Blank filler rows — real GRUB's box is a fixed height
                  (room for far more entries than most machines actually
                  have installed), not sized tightly around however many
                  entries exist. aria-hidden since there's nothing here
                  for a screen reader to announce. */}
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="px-3 py-1 text-sm sm:text-base" aria-hidden="true">
                  &nbsp;
                </div>
              ))}
            </div>
            <p className="text-xs sm:text-sm mt-4 leading-relaxed">
              Use the ↑ and ↓ keys to select which entry is highlighted.
              <br />
              Press enter to boot the selected OS.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
