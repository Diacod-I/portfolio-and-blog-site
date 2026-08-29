'use client'

// Scattered frames for the hidden "image exhibition" easter egg (see the
// hidden zone above the Home tab's normal starting position in
// HomeClient.tsx), absolutely placed and slightly rotated for a "hung
// unevenly on a gallery wall" feel rather than a tidy grid.
//
// Two frame styles:
//  - `src` frames render as a polaroid: white card, the photo itself via
//    next/image, and a bottom margin — deliberately taller than the
//    top/side margins, same proportions as a real instant photo — for the
//    handwritten-style caption (frame.caption, set in
//    data/exhibitionFrames.ts) in Edu NSW/ACT Cursive. Every frame in
//    exhibitionFrames.ts is one of these right now — the black-outline
//    placeholder fallback below is unused in practice at the moment, kept
//    around for whenever a frame gets added without a photo for it yet.
//  - Frames without a `src` fall back to a plain black-outline box
//    instead (see exhibitionFrames.ts's file header for why a bare
//    outline used to be the *only* option in part of this zone, and isn't
//    anymore).
//
// object-cover, not object-contain: each `src` frame's widthPx/heightPx in
// exhibitionFrames.ts is that photo's own real aspect ratio (capped at
// 170px on the longer side only) — not clamped into a "plausible
// polaroid" range the way an earlier version did. That clamping caused
// visible top/bottom cropping on anything far from the clamp range (a
// couple of these are naturally tall, narrow phone photos), which is
// exactly the "photos have their height clipped" problem it was changed
// to fix. Since each box's aspect ratio now matches its photo almost
// exactly, object-cover has (essentially) nothing left to crop — it's
// kept over object-contain mainly so a fraction-of-a-pixel rounding
// mismatch between the box's integer px size and the photo's exact ratio
// fills the box cleanly instead of leaving a hairline letterbox gap.
import { memo } from 'react'
import Image from 'next/image'
import { EXHIBITION_FRAMES } from '@/data/exhibitionFrames'

// Sorted ascending by topPct once, at module scope — only used by the
// `compact` stacked layout below, but computed here rather than inline in
// the render so it isn't re-sorted on every render. Ascending (not the
// data file's own declaration order) so the stack reads top-to-bottom the
// same way the desktop absolute layout reads bottom-to-top-of-container:
// the frame with the smallest topPct (closest to the top of the zone,
// reached LAST when scrolling up — see data/exhibitionFrames.ts's own
// comment on EXHIBITION_FRAMES_MAX_TOP_PCT) renders first/highest in the
// stack, and the largest-topPct ("dark zone") frames end up last/lowest —
// right next to the "bottom of the dark zone" quote in HomeClient.tsx —
// preserving the same scroll-discovery order in both layouts.
const STACKED_FRAMES = [...EXHIBITION_FRAMES].sort((a, b) => a.topPct - b.topPct)

// memo()'d for the same reason as FaultyTerminalBackground (see that
// file's own comment): this renders unconditionally alongside the Home
// tab's "$ >" typed query and boot log, both of which re-render the whole
// HomeClient tree every 40-90ms while they play. `compact` is the one
// prop this takes — see HomeClient.tsx's galleryCompact — and only
// changes on an actual container resize, so this still essentially never
// re-renders from its parent in practice; memo's default shallow prop
// comparison handles a single boolean prop fine.
function ImageExhibition({ compact }: { compact: boolean }) {
  // Compact layout (narrow phone viewport OR a desktop window resized
  // down small — see galleryCompact's own comment in HomeClient.tsx for
  // why this is a measured-container check, not a viewport media query):
  // the frames below are positioned by percentage of the container's
  // width but sized in fixed pixels, hand-tuned against an assumed
  // ~1000px-wide desktop window (see data/exhibitionFrames.ts's header) —
  // well below that width, some frames' leftPct + widthPx runs straight
  // past the container's right edge, clipped off entirely. Rather than
  // trying to rescale/re-pack ~30 hand-placed positions for every possible
  // narrow width, this switches to a completely different, much simpler
  // layout instead: a single vertical column, one frame per row, normal
  // document flow (no absolute/left/top at all, so there's nothing left
  // to overflow), centered, with real vertical gaps between frames so
  // they read as a tidy stack rather than the cluttered/overlapping mess
  // simply shrinking the same absolute layout down would produce. Slight
  // rotation is kept per frame for character — small enough at these
  // amounts (under 5deg) that it doesn't meaningfully affect a centered
  // column's effective width the way the desktop scatter's large leftPct
  // spread would.
  if (compact) {
    return (
      <div className="relative w-full flex flex-col items-center gap-10 px-4 py-10" aria-hidden>
        {STACKED_FRAMES.map((frame) => {
          if (!frame.src) {
            return (
              <div
                key={frame.id}
                className="border-2 border-black flex items-center justify-center shrink-0"
                style={{ width: frame.widthPx, height: frame.heightPx, transform: `rotate(${frame.rotationDeg}deg)` }}
              >
                <span className="text-black/40 text-[10px] font-mono text-center px-2">Image placeholder</span>
              </div>
            )
          }
          return (
            <div
              key={frame.id}
              className="bg-white pt-2 px-2 pb-1.5 shadow-[0_3px_10px_rgba(0,0,0,0.5)] shrink-0"
              style={{ width: frame.widthPx + 16, transform: `rotate(${frame.rotationDeg}deg)` }}
            >
              <div className="relative overflow-hidden bg-black" style={{ width: frame.widthPx, height: frame.heightPx }}>
                <Image src={frame.src} alt={frame.alt ?? ''} fill sizes="170px" className="object-cover" />
              </div>
              {frame.caption && (
                <p
                  className="text-center text-neutral-800 mt-2 leading-tight"
                  style={{ fontFamily: "'Edu NSW ACT Cursive', cursive", fontSize: 18 }}
                >
                  {frame.caption}
                </p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {EXHIBITION_FRAMES.map((frame) => {
        if (!frame.src) {
          return (
            <div
              key={frame.id}
              className="absolute border-2 border-black flex items-center justify-center"
              style={{
                left: `${frame.leftPct}%`,
                top: `${frame.topPct}%`,
                width: frame.widthPx,
                height: frame.heightPx,
                transform: `rotate(${frame.rotationDeg}deg)`,
              }}
            >
              <span className="text-black/40 text-[10px] font-mono text-center px-2">
                Image placeholder
              </span>
            </div>
          )
        }
        return (
          <div
            key={frame.id}
            className="absolute bg-white pt-2 px-2 pb-1.5 shadow-[0_3px_10px_rgba(0,0,0,0.5)]"
            style={{
              left: `${frame.leftPct}%`,
              top: `${frame.topPct}%`,
              width: frame.widthPx + 16,
              transform: `rotate(${frame.rotationDeg}deg)`,
            }}
          >
            <div
              className="relative overflow-hidden bg-black"
              style={{ width: frame.widthPx, height: frame.heightPx }}
            >
              <Image
                src={frame.src}
                alt={frame.alt ?? ''}
                fill
                sizes="170px"
                className="object-cover"
              />
            </div>
            {frame.caption && (
              <p
                className="text-center text-neutral-800 mt-2 leading-tight"
                style={{ fontFamily: "'Edu NSW ACT Cursive', cursive", fontSize: 18 }}
              >
                {frame.caption}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default memo(ImageExhibition)
