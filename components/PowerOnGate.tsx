'use client'

// "Boot menu" gate for a cold landing on '/' — see AppShellHost.tsx for
// exactly when this renders (only when '/' is the very first route this
// session, not on every visit to '/' — navigating back to '/' later via
// the nav bar doesn't re-trigger it, since that click already satisfies
// the browser gesture requirement below on its own).
//
// Why this exists: two reasons — one historical, one current.
//
// It started as a fix for an autoplay problem: browsers block any
// audio.play()/AudioContext call that isn't triggered directly inside a
// real user gesture (click, tap, keydown) until the page has seen at least
// one such gesture — see SoundEffects.tsx's own long comment on this.
// HomeClient's Home tab starts typing its "$ >" query (and playing a
// keystroke sound per character, plus a boot log, plus a "dossier ready"
// chime) automatically the moment advith.exe is open — which, since window
// state persists across reloads (see windowStore.ts), can genuinely happen
// on a *reload* of '/' if advith.exe was already open on the Home tab from
// earlier in the session. That's exactly the case this component's own
// gate prevents from ever mattering: HomeClient (and the store rehydration
// that restores that prior state) doesn't mount at all until *after* the
// user has clicked through the boot menu below — and that click is itself
// a real gesture, satisfying the browser's autoplay requirement for the
// whole rest of the page well before HomeClient's auto-typing effect ever
// runs.
//
// This component stuck around and grew well past that original need,
// because it's since become a deliberate part of the experience in its own
// right: reloading '/' now plays through an actual boot sequence — a
// pre-boot screen, this bootloader menu, a loading heart, a chime — before
// handing off to the desktop, so a reload genuinely reads as "restarting
// the machine" rather than just refreshing a webpage (restoring the
// previous window layout underneath that, rather than wiping it, is no
// different from how a real OS's "reopen windows after restart" setting
// works). Gating the whole first '/' landing behind one explicit
// selection, rather than special-casing "is a sound about to autoplay"
// case by case, is simply the more robust way to guarantee the audio side
// of this — it's just no longer the primary reason this exists.
//
// Six phases, in order, purely timed except 'menu' (which waits on the
// user):
//   'preboot-blue'   — the very first thing shown: a solid blue screen,
//                       PREBOOT_BLUE_MS long, echoing the "no signal yet"
//                       blue a real monitor/BIOS shows before anything
//                       else appears.
//   'preboot-cursor' — black screen, nothing but a blinking underscore
//                       cursor in the top left (see win98-cursor-blink in
//                       globals.css), PREBOOT_CURSOR_MS long — the classic
//                       pre-OS "still booting firmware" beat.
//   'menu'           — the GRUB-style boot menu (see BOOT_ENTRIES below):
//                       one real, bootable entry (Advith-OS) plus several
//                       garbage entries that look installed but aren't —
//                       clicking/selecting+entering one of those shows a
//                       GRUB-style "not found" error and stays on the
//                       menu instead of proceeding. Arrow keys move the
//                       highlight, click or Enter attempts to boot
//                       whichever entry is currently selected/clicked.
//   'boot-logo'      — once Advith-OS is actually selected: the site's
//                       pixel-heart logo (see PixelHeartLogo below) sits
//                       alone on screen, not yet beating, for
//                       LOGO_ALONE_MS — same idea as a device's
//                       manufacturer logo appearing before its progress
//                       bar does.
//   'boot-loading'   — the heart starts beating (win98-pixel-heart-beat)
//                       and a loading bar fades in below it and fills
//                       left to right over SPLASH_LOADING_MS.
//   'boot-reveal'    — plays a synthesized startup chime (same one-off-
//                       AudioContext pattern as Minesweeper's explosion —
//                       see that file — rather than the reused-context
//                       pattern HomeClient's playTypeSound uses, since
//                       this only ever fires once per session) while the
//                       real desktop wallpaper fades in from behind a
//                       black overlay — echoing a real OS boot (chime +
//                       splash fading to the desktop). Once the fade
//                       finishes, onStart() fires and this component
//                       unmounts for good, handing off to the real
//                       HomeClient (which renders that exact same
//                       wallpaper — see its own backgroundImage — so
//                       there's no visual jump at handoff).
import { useCallback, useEffect, useState } from 'react'

type PowerOnGateProps = {
  onStart: () => void
}

type Phase = 'preboot-blue' | 'preboot-cursor' | 'menu' | 'boot-logo' | 'boot-loading' | 'boot-reveal'

// Solid blue "no signal yet" beat before anything else appears.
const PREBOOT_BLUE_MS = 1000
// Black screen with just the blinking cursor, the classic "firmware is
// still doing something" beat right before the boot menu shows up.
const PREBOOT_CURSOR_MS = 2000

// How long the heart logo sits alone (not beating yet, no bar) once
// Advith-OS is selected, before the loading bar itself starts.
const LOGO_ALONE_MS = 1000
// How long the loading bar's own fill takes, once it starts — long enough
// to read as an actual fill, not just a flash. The heart beats throughout
// this whole stretch (see PixelHeartLogo's `beating` prop below).
const SPLASH_LOADING_MS = 2200

// How long the wallpaper-reveal fade itself takes, once 'boot-reveal'
// begins — onStart() fires this long after the fade begins, not
// immediately, so the fade is actually visible before HomeClient takes
// over.
const BOOT_FADE_MS = 1600

// The boot menu's entries. Only the first is real — everything else is
// set dressing that LOOKS like a normal multi-boot GRUB menu (a recovery
// environment, memtest, an "advanced options" submenu — all genuine
// staples of a real /boot/grub/grub.cfg) but can't actually be booted:
// selecting one shows a GRUB-style "file not found" error and leaves the
// user back on the menu, same as a real broken bootloader entry would.
type BootEntry = {
  label: string
  bootable: boolean
}
const BOOT_ENTRIES: BootEntry[] = [
  { label: 'Advith-OS', bootable: true },
  { label: 'Windows Recovery Environment', bootable: false },
  { label: 'memtest86+', bootable: false },
  { label: '/dev/sda2 (unreadable)', bootable: false },
  { label: 'Advanced options for Ubuntu', bootable: false },
]
// Real GRUB pads its box out to a fixed height regardless of how many
// entries are actually installed (see the blank filler rows below) — this
// is that fixed row count, entries included, so the box stays the same
// tall, mostly-empty shape it always has.
const MENU_TOTAL_ROWS = 10

// Small pixel-art beating heart for the 'boot-logo'/'boot-loading' phases
// — same 7-wide by 6-tall grid technique as HomeClient.tsx's own
// PixelHeart (see that file), duplicated locally rather than imported so
// this file stays a self-contained, standalone gate with no dependency on
// the (much larger) HomeClient module. `beating` gates the
// win98-pixel-heart-beat animation (see globals.css) — off while the logo
// sits alone in 'boot-logo', on once 'boot-loading' starts, so the heart
// visibly "starts beating when the loading happens" rather than beating
// from the very first frame.
const PIXEL_HEART_ROWS = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']
function PixelHeartLogo({ beating }: { beating: boolean }) {
  return (
    <span
      className={`inline-block${beating ? ' win98-pixel-heart-beat' : ''}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 7 6" width={56} height={48} shapeRendering="crispEdges">
        {PIXEL_HEART_ROWS.flatMap((row, y) =>
          row
            .split('')
            .map((cell, x) => (cell === 'X' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#e8283f" /> : null))
        )}
      </svg>
    </span>
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
  const [phase, setPhase] = useState<Phase>('preboot-blue')
  // Starts true (opaque black, hiding the wallpaper beneath) and flips to
  // false once 'boot-reveal' begins — see that phase's effect below for
  // why a plain effect (not an extra setTimeout) is enough to make this an
  // actual observed transition instead of skipping straight to its end
  // state before the browser paints the start of it.
  const [fadeOut, setFadeOut] = useState(false)
  // Which boot-menu entry is currently highlighted (arrow keys move this;
  // clicking an entry both highlights and immediately attempts it).
  const [selectedIndex, setSelectedIndex] = useState(0)
  // Set when the user attempts to boot a non-bootable entry — a GRUB-
  // style "file not found" line shown under the menu box, cleared the
  // next time the selection moves or another attempt is made.
  const [bootError, setBootError] = useState<string | null>(null)

  // Purely timed hand-off through the two pre-boot beats — no interaction
  // gates either of these, same as real firmware working through its own
  // splash/POST screens before it ever reaches a boot menu.
  useEffect(() => {
    if (phase !== 'preboot-blue') return
    const t = setTimeout(() => setPhase('preboot-cursor'), PREBOOT_BLUE_MS)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'preboot-cursor') return
    const t = setTimeout(() => setPhase('menu'), PREBOOT_CURSOR_MS)
    return () => clearTimeout(t)
  }, [phase])

  // Attempts to boot whichever entry index is passed in — used by both a
  // direct click on an entry (which should select AND immediately attempt
  // it, not just highlight it) and the Enter key (which attempts whatever
  // is already highlighted). Real entries move on to 'boot-logo'; fake
  // ones surface a GRUB-style error and leave phase alone.
  const attemptBoot = useCallback(
    (index: number) => {
      if (phase !== 'menu') return
      setSelectedIndex(index)
      const entry = BOOT_ENTRIES[index]
      if (!entry.bootable) {
        setBootError(`error: '${entry.label}' not found.`)
        return
      }
      setBootError(null)
      setPhase('boot-logo')
    },
    [phase]
  )

  // Arrow keys move the highlight (wrapping at either end, same as real
  // GRUB), Enter attempts to boot whatever's currently highlighted — all
  // only while 'menu' is showing; the effect re-runs and detaches this the
  // instant phase flips away, same pattern as every other phase-scoped
  // listener in this file.
  useEffect(() => {
    if (phase !== 'menu') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        attemptBoot(selectedIndex)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setBootError(null)
        setSelectedIndex((i) => (i + 1) % BOOT_ENTRIES.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setBootError(null)
        setSelectedIndex((i) => (i - 1 + BOOT_ENTRIES.length) % BOOT_ENTRIES.length)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, selectedIndex, attemptBoot])

  // 'boot-logo' -> 'boot-loading' -> 'boot-reveal', purely timed, same as
  // the two pre-boot beats above.
  useEffect(() => {
    if (phase !== 'boot-logo') return
    const t = setTimeout(() => setPhase('boot-loading'), LOGO_ALONE_MS)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'boot-loading') return
    const t = setTimeout(() => setPhase('boot-reveal'), SPLASH_LOADING_MS)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'boot-reveal') return
    // No extra setTimeout needed here (unlike the timed phases above) —
    // this effect only runs once React has already committed AND painted
    // the render where phase first became 'boot-reveal' (with fadeOut
    // still false, wallpaper hidden), so setFadeOut(true) here is
    // guaranteed to be a *second*, later paint — which is exactly what
    // makes the opacity change an actually-observed CSS transition
    // instead of jumping straight to its end state.
    playBootChime()
    setFadeOut(true)
    const t = setTimeout(onStart, BOOT_FADE_MS)
    return () => clearTimeout(t)
  }, [phase, onStart])

  const showLogoScreen = phase === 'boot-logo' || phase === 'boot-loading'

  return (
    <div className="fixed inset-0 z-[99999] bg-black">
      {/* Real desktop wallpaper, revealed as the black overlay below
          fades out — same image/sizing HomeClient uses for the actual
          desktop, so the handoff at onStart() is seamless. Only rendered
          once the reveal actually starts; no reason to pay for it any
          earlier. */}
      {phase === 'boot-reveal' && (
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
      {phase === 'preboot-blue' && <div className="absolute inset-0" style={{ backgroundColor: '#0000aa' }} />}
      {phase === 'preboot-cursor' && (
        <div className="absolute inset-0 bg-black">
          <span
            className="win98-cursor-blink absolute top-4 left-6 sm:top-6 sm:left-8 font-mono text-2xl sm:text-3xl text-[#c0c0c0] select-none"
            aria-hidden="true"
          >
            _
          </span>
        </div>
      )}
      {showLogoScreen && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 select-none">
          <PixelHeartLogo beating={phase === 'boot-loading'} />
          {/* Sunken win98-bezel-style bar (matches this site's other
              "loading" chrome, e.g. WindowsLoader's own progress track) —
              the fill is a single CSS animation timed to SPLASH_LOADING_MS
              (see win98-boot-loading-fill in globals.css), not JS-driven
              width state, so there's nothing to keep in sync with the
              setTimeout above beyond both reading the same duration.
              The outer track is always rendered (even during 'boot-logo')
              so the heart above it never has to shift position once the
              bar appears — only its opacity changes, and the inner fill
              div (and its animation) doesn't even mount until
              'boot-loading', so the fill genuinely starts right as it
              fades in, not earlier. */}
          <div
            className="w-40 h-2.5 border border-[#808080] bg-black p-[1px] transition-opacity duration-300"
            style={{ opacity: phase === 'boot-loading' ? 1 : 0 }}
          >
            {phase === 'boot-loading' && (
              <div className="win98-boot-loading-fill h-full bg-[#c0c0c0]" style={{ animationDuration: `${SPLASH_LOADING_MS}ms` }} />
            )}
          </div>
        </div>
      )}
      {phase === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[#c0c0c0] select-none px-4">
          {/* Laid out to match real GRUB2's default text menu as closely
              as CSS reasonably allows: "GNU GRUB  version X.XX" above a
              bordered box, the highlighted entry inverted (a slight,
              gentle dim-pulse via win98-grub-blink, not fully static —
              per feedback, real GRUB's fully static bar read as a little
              too inert), the rest of the entries plain text on black, and
              the box padded out with blank rows to the same tall,
              mostly-empty shape GRUB's box has even with only a couple
              entries installed. See CreditsWindow.tsx's Design &
              Inspiration section for the trademark note this borrows the
              same disclosure pattern from (the Windows 98 homage above
              it). */}
          <div className="w-full max-w-xl">
            <p className="text-sm sm:text-base mb-2">Not GNU GRUB&nbsp;&nbsp;version 2.06</p>
            <div className="border border-[#c0c0c0]">
              {BOOT_ENTRIES.map((entry, i) => (
                // Real <button>s, not styled divs — matches
                // SoundEffects.tsx's own INTERACTIVE_SELECTOR (button,
                // ...), so clicking one also produces the site's normal
                // click sound right alongside the boot chime (for the one
                // real entry) or the error line (for the rest). outline-
                // none/focus-visible:outline-none strip the browser's own
                // default focus ring — the highlight here is entirely
                // this component's own bg/blink styling, so a native blue
                // focus rectangle on top of it (which clicking a button
                // normally leaves behind) would just look like a stray
                // rendering glitch.
                <button
                  key={entry.label}
                  type="button"
                  onClick={() => attemptBoot(i)}
                  className={`w-full text-left px-3 py-1 text-sm sm:text-base outline-none focus:outline-none focus-visible:outline-none ${
                    i === selectedIndex ? 'win98-grub-blink bg-[#c0c0c0] text-black' : 'bg-black text-[#c0c0c0] hover:bg-[#1a1a1a]'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
              {/* Blank filler rows — real GRUB's box is a fixed height
                  (room for far more entries than most machines actually
                  have installed), not sized tightly around however many
                  entries exist. aria-hidden since there's nothing here
                  for a screen reader to announce. */}
              {Array.from({ length: Math.max(0, MENU_TOTAL_ROWS - BOOT_ENTRIES.length) }).map((_, i) => (
                <div key={i} className="px-3 py-1 text-sm sm:text-base" aria-hidden="true">
                  &nbsp;
                </div>
              ))}
            </div>
            {bootError && (
              <p className="text-xs sm:text-sm mt-3 text-[#ff6b6b]" role="alert">
                {bootError}
              </p>
            )}
            <p className="text-xs sm:text-sm mt-4 leading-relaxed">
              Use the ↑ and ↓ keys to select which entry is highlighted.
            </p>
            {/* Kept on its own line (separate from the arrow-key
                instruction above), plain white text, no rainbow. */}
            <p className="text-xs sm:text-sm mt-1 leading-relaxed text-white">
              Click on the entry, or press Enter, to boot the selected OS.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
