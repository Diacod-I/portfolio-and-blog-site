'use client'

// Scattered frames for the hidden "image exhibition" easter egg (see the
// hidden zone above the Home tab's normal starting position in
// HomeClient.tsx), absolutely placed and slightly rotated for a "hung
// unevenly on a gallery wall" feel rather than a tidy grid — except in
// `compact` mode (narrow phone widths), which drops all of that for a
// plain vertical stack instead. See the `compact` prop doc below for why
// there are two layouts instead of one that scales down to fit.
//
// Two frame styles (both modes):
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
// Compact mode reuses this same reasoning at a different target size (see
// COMPACT_CARD_MAX_WIDTH below).
import { memo } from 'react'
import Image from 'next/image'
import { EXHIBITION_FRAMES } from '@/data/exhibitionFrames'

type ImageExhibitionProps = {
  /** 1 at/above the ~1000px design width this layout was hand-placed
   *  against (data/exhibitionFrames.ts's own header); below that, the
   *  fraction of the design width the container is actually rendering
   *  at — see the file header above and HomeClient.tsx's galleryScale.
   *  Ignored while `compact` is true. */
  scale: number
  /** True below a width threshold (see HomeClient.tsx's galleryCompact) —
   *  switches from the scattered/scaled layout to a plain single-column
   *  stack instead of just shrinking the scattered one further.
   *
   *  This was tried once before purely with `scale`: keep the exact same
   *  absolutely-positioned layout at every width and shrink it uniformly
   *  to fit. That does stop the clipping, but on an actual phone (~350px
   *  wide, against a ~1000px design) the shrink factor is roughly 0.3-0.35
   *  — even the biggest photos render at maybe 5-6% of the screen width,
   *  effectively unviewable. There's no `scale` value that fixes this: the
   *  scattered layout's positions only avoid overlapping each other at
   *  (approximately) the original ~1000px design width, so any bigger
   *  scale reintroduces the clipping/crowding this was built to prevent
   *  in the first place. Below the threshold, this switches to a
   *  completely different layout instead — normal document flow, one
   *  photo per row, each shown at a real, legible size independent of the
   *  scattered positions entirely — rather than trying to find a
   *  compromise scale that doesn't really exist. Desktop (including a
   *  resized-down window, floored by advith.exe's own minSize) keeps the
   *  scattered "gallery wall" look untouched. */
  compact: boolean
}

// Frames are placed by percentage of the full design width/height at
// every OTHER prop (scale mode), but compact mode has no shared canvas to
// be a percentage of — each card is just sized against a flat cap instead.
// 280px comfortably fits inside a ~320-430px phone viewport once
// homeScrollRef's own px-4 padding is subtracted, without needing to
// measure the actual container width for this (unlike scale mode, compact
// mode doesn't attempt to fill the container edge-to-edge — a little
// breathing room on the sides reads as intentional margin, not clipping).
const COMPACT_CARD_MAX_WIDTH = 280

// memo()'d for the same reason as FaultyTerminalBackground (see that
// file's own comment): this renders unconditionally alongside the Home
// tab's "$ >" typed query and boot log, both of which re-render the whole
// HomeClient tree every 40-90ms while they play. `scale`/`compact` are the
// only two props this takes, and only change on an actual container
// resize (scale rounded to 2dp, compact a plain boolean, both computed in
// HomeClient.tsx specifically to avoid spamming this with a slightly
// different prop on every single ResizeObserver tick), so this still
// essentially never re-renders from its parent in practice; memo's
// default shallow prop comparison handles two primitive props fine.
function ImageExhibition({ scale, compact }: ImageExhibitionProps) {
  if (compact) {
    // Plain vertical stack, normal document flow — nothing absolutely
    // positioned, so nothing to overflow, and no transform/rotation
    // either (the scattered layout's tilt reads fine at a glance across a
    // whole wall of small photos; on a single full-width photo at a time
    // it just eats into the space and makes the caption harder to read
    // for no real benefit).
    //
    // Sorted ascending by topPct so the stack's scroll-discovery order —
    // which frame you reach first/last scrolling up into this hidden
    // zone — still matches the scattered layout's own bottom-to-top
    // reading order (see EXHIBITION_FRAMES_MAX_TOP_PCT's own comment in
    // data/exhibitionFrames.ts: the largest topPct is the first frame
    // reached scrolling up from the resting position, i.e. it belongs at
    // the bottom of this stack, reached first — so ascending topPct puts
    // it last in DOM order/bottom of the page, exactly where it needs to
    // be).
    const sorted = [...EXHIBITION_FRAMES].sort((a, b) => a.topPct - b.topPct)
    return (
      <div className="flex flex-col items-center gap-10 py-6" aria-hidden>
        {sorted.map((frame) =>
          !frame.src ? (
            <div
              key={frame.id}
              className="border-2 border-black flex items-center justify-center w-full aspect-square"
              style={{ maxWidth: COMPACT_CARD_MAX_WIDTH }}
            >
              <span className="text-black/40 text-xs font-mono text-center px-2">
                Image placeholder
              </span>
            </div>
          ) : (
            <div
              key={frame.id}
              className="bg-white pt-2 px-2 pb-1.5 shadow-[0_3px_10px_rgba(0,0,0,0.5)] w-full"
              style={{ maxWidth: COMPACT_CARD_MAX_WIDTH }}
            >
              <div
                className="relative w-full overflow-hidden bg-black"
                style={{ aspectRatio: `${frame.widthPx} / ${frame.heightPx}` }}
              >
                <Image
                  src={frame.src}
                  alt={frame.alt ?? ''}
                  fill
                  sizes={`${COMPACT_CARD_MAX_WIDTH}px`}
                  placeholder="blur"
                  className="object-cover"
                />
              </div>
              {frame.caption && (
                <p
                  className="text-center text-neutral-800 mt-2 leading-tight"
                  style={{ fontFamily: "'Edu NSW ACT Cursive', cursive", fontSize: 20 }}
                >
                  {frame.caption}
                </p>
              )}
            </div>
          )
        )}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {EXHIBITION_FRAMES.map((frame) => {
        // scale() before rotate() so both apply around the same
        // transformOrigin (top left, i.e. the leftPct/topPct anchor
        // point) — shrinking a frame never moves where it's anchored,
        // only how far it extends right/down from there.
        const transform = `scale(${scale}) rotate(${frame.rotationDeg}deg)`
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
                transform,
                transformOrigin: 'top left',
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
              transform,
              transformOrigin: 'top left',
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
                placeholder="blur"
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
