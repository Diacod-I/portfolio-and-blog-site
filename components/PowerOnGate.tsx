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
// "before" the win98 desktop exists yet. Three phases:
//   'splash'  — the very first thing shown, itself two beats: a small
//               device logo (see PixelLogo below) sits alone on screen
//               for LOGO_ALONE_MS, then a loading bar fades in below it
//               and fills left to right over SPLASH_LOADING_MS — same
//               idea as a real machine's manufacturer logo appearing
//               before its progress bar does (think the Apple logo, then
//               the progress bar, on a Mac). Purely timed — no
//               interaction, nothing to click — and hands off to 'menu'
//               automatically once both beats have elapsed.
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
import { useCallback, useEffect, useState } from 'react'

type PowerOnGateProps = {
  onStart: () => void
}

// 'splash' now has two beats, not one: the logo sits alone first (no
// loading bar yet — see showLoadingBar below), then the loading bar fades
// in and starts its fill. Per feedback, showing both from the very first
// frame didn't read as an actual boot sequence — a real device shows its
// logo for a beat before a progress indicator even appears.
const LOGO_ALONE_MS = 1000
// How long the loading bar's own fill takes, once it starts (i.e. after
// LOGO_ALONE_MS has already elapsed) — long enough to read as an actual
// fill, not just a flash. 'splash' hands off to 'menu' this long after the
// bar starts, so LOGO_ALONE_MS + SPLASH_LOADING_MS is the total time spent
// on 'splash'.
const SPLASH_LOADING_MS = 2200

// A brief pause after selecting the entry — chime plays, screen stays
// black a beat longer, THEN the wallpaper starts revealing — instead of
// the reveal beginning the instant it's selected. Echoes the pause real
// hardware/firmware takes before a boot splash actually shows up.
const BOOT_DELAY_MS = 1000

// How long the wallpaper-reveal fade itself takes, once it starts (i.e.
// after BOOT_DELAY_MS has already elapsed) — onStart() fires this long
// after the fade begins, not immediately, so the fade is actually visible
// before HomeClient takes over.
const BOOT_FADE_MS = 1600

// Small pixel-art ">_" mark for the 'splash' phase — a blocky terminal
// chevron-and-cursor glyph rather than a literal "device" logo, since
// there's no real hardware brand to reference here; ties back to the same
// "$ >" prompt/blinking-cursor motif HomeClient's Home tab types out (see
// HOME_QUERY_TEXT and the cursor block right after it), so the one moment
// "before" the desktop exists still reads as the same machine. Same
// grid-of-SVG-rects technique as HomeClient.tsx's PixelHeart — 'X' cells
// draw the chevron in the boot menu's own #c0c0c0 gray, 'O' cells draw the
// cursor bar in the same green (#00FF00) HomeClient's own typing cursor
// and boot log "OK" status use.
const PIXEL_LOGO_ROWS = [
  '.........',
  'XX.......',
  '..XX.....',
  '....XX...',
  '..XX.....',
  'XX.......',
  '.........',
  '...OOOOO.',
]
function PixelLogo() {
  return (
    <svg viewBox="0 0 9 8" width={72} height={64} shapeRendering="crispEdges" aria-hidden="true">
      {PIXEL_LOGO_ROWS.flatMap((row, y) =>
        row.split('').map((cell, x) => {
          if (cell === '.') return null
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={cell === 'O' ? '#00FF00' : '#c0c0c0'} />
        })
      )}
    </svg>
  )
}

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
  const [phase, setPhase] = useState<'splash' | 'menu' | 'booting'>('splash')
  // Starts true (opaque black, hiding the wallpaper beneath) and flips to
  // false one frame after entering 'booting' — the delay is what makes
  // the opacity change an actual observed transition instead of skipping
  // straight to its end state before the browser paints the start of it.
  const [fadeOut, setFadeOut] = useState(false)
  // Gates the loading bar within 'splash' — false for the first
  // LOGO_ALONE_MS (logo alone on screen), then true for the rest of
  // 'splash' (bar fades in and starts its fill). See the JSX below for how
  // this avoids a layout jump: the bar's own bordered track is always
  // rendered, just invisible until this flips, so the logo never has to
  // shift position once the bar appears.
  const [showLoadingBar, setShowLoadingBar] = useState(false)

  // Purely timed hand-off through 'splash' — no interaction gates any of
  // this, same as a real machine's logo/progress-bar screen before it
  // reaches a boot menu.
  useEffect(() => {
    if (phase !== 'splash') return
    const toBar = setTimeout(() => setShowLoadingBar(true), LOGO_ALONE_MS)
    const toMenu = setTimeout(() => setPhase('menu'), LOGO_ALONE_MS + SPLASH_LOADING_MS)
    return () => {
      clearTimeout(toBar)
      clearTimeout(toMenu)
    }
  }, [phase])

  const handleSelect = useCallback(() => {
    if (phase !== 'menu') return
    setPhase('booting')
    // Chime plays from the effect below, once BOOT_DELAY_MS has elapsed,
    // in lockstep with the wallpaper starting to fade in — not here — so
    // the sound and the visual reveal actually happen together instead of
    // the chime firing (and mostly finishing its decay) during the silent
    // black-screen pause that comes first.
  }, [phase])

  // The button itself already has autoFocus, so real GRUB-style Enter
  // handling mostly happens for free (a focused native <button> fires a
  // click on Enter) — but this listens on the window too, so Enter boots
  // the entry even if focus ever ended up elsewhere (e.g. a stray click on
  // the page background before the keypress). Only attached during 'menu'
  // — the effect re-runs and detaches it the instant phase flips away.
  useEffect(() => {
    if (phase !== 'menu') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      e.preventDefault()
      handleSelect()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, handleSelect])

  useEffect(() => {
    if (phase !== 'booting') return
    // Screen stays solid black (and silent) for BOOT_DELAY_MS after the
    // entry is selected, then the chime and the reveal fade both start in
    // the same tick, then the fade itself takes BOOT_FADE_MS — onStart()
    // fires once both have elapsed, so HomeClient takes over right as the
    // fade visually finishes. Delaying the chime this way (rather than
    // playing it immediately on selection) is still well within the
    // page's user-activation window — the selecting click/Enter press is
    // itself the qualifying gesture, and that "this document has had a
    // real user gesture" flag is what unblocks AudioContext playback, not
    // strict millisecond-level synchronicity with the gesture itself.
    const toReveal = setTimeout(() => {
      playBootChime()
      setFadeOut(true)
    }, BOOT_DELAY_MS)
    const toStart = setTimeout(onStart, BOOT_DELAY_MS + BOOT_FADE_MS)
    return () => {
      clearTimeout(toReveal)
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
      {phase === 'splash' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 select-none">
          <PixelLogo />
          {/* Sunken win98-bezel-style bar (matches this site's other
              "loading" chrome, e.g. WindowsLoader's own progress track) —
              the fill is a single CSS animation timed to SPLASH_LOADING_MS
              (see win98-boot-loading-fill in globals.css), not JS-driven
              width state, so there's nothing to keep in sync with the
              setTimeout above beyond both reading the same duration.
              The outer track is always rendered (even before
              showLoadingBar flips) so the logo above it never has to shift
              position once the bar appears — only its opacity changes,
              and the inner fill div (and its animation) doesn't even
              mount until showLoadingBar is true, so the fill genuinely
              starts right as it fades in, not earlier. */}
          <div
            className="w-40 h-2.5 border border-[#808080] bg-black p-[1px] transition-opacity duration-300"
            style={{ opacity: showLoadingBar ? 1 : 0 }}
          >
            {showLoadingBar && (
              <div className="win98-boot-loading-fill h-full bg-[#c0c0c0]" style={{ animationDuration: `${SPLASH_LOADING_MS}ms` }} />
            )}
          </div>
        </div>
      )}
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
            <p className="text-sm sm:text-base mb-2">Not GNU GRUB&nbsp;&nbsp;version 2.06</p>
            <div className="border border-[#c0c0c0]">
              {/* A real <button>, not a styled div — native Enter/Space
                  handling for free, and it matches SoundEffects.tsx's own
                  INTERACTIVE_SELECTOR (button, ...), so selecting it also
                  produces the site's normal click sound right alongside
                  the boot chime above. win98-grub-blink adds a slight,
                  gentle dim-pulse to the highlight (see globals.css) — per
                  feedback, real GRUB's fully static bar read as a little
                  too inert; text stays black throughout so it's never hard
                  to read mid-pulse. */}
              <button
                type="button"
                onClick={handleSelect}
                autoFocus
                className="win98-grub-blink w-full text-left px-3 py-1 text-sm sm:text-base bg-[#c0c0c0] text-black"
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
            </p>
            {/* Kept on its own line (separate from the arrow-key
                instruction above) but no longer has the rainbow
                background — just plain white text now. */}
            <p className="text-xs sm:text-sm mt-1 leading-relaxed text-white">
              Press Enter to boot the selected OS.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
