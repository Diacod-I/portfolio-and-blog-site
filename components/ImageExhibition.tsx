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
//    data/exhibitionFrames.ts) in Cedarville Cursive.
//  - Frames without a `src` still fall back to the original black-outline
//    placeholder (see exhibitionFrames.ts's "dark zone" section).
//
// object-cover, not object-contain: each `src` frame's widthPx/heightPx in
// exhibitionFrames.ts is that photo's aspect ratio *clamped* to a
// plausible polaroid range (not its raw, sometimes extreme, aspect
// ratio — a very tall/narrow phone photo forced into a "no cropping" box
// would render as a near-invisible sliver once it also needs to look like
// a normal photo card). object-cover crops the photo to fill that clamped
// box exactly instead of letterboxing it, same as slotting a photo that's
// a slightly different shape than the frame it's going into — a little
// gets trimmed off the long edge, nothing gets distorted or left with
// gaps.
//
// Black borders on the placeholder frames specifically: this zone's
// background washes from the faulty-terminal shader's black backdrop up
// to white/pink the further up you scroll (see uDissolveProgress in
// FaultyTerminalBackground.tsx), so a black-bordered placeholder low in
// the zone starts out nearly blended into the dark backdrop and gradually
// stands out as the wash lightens further up — not a bug, part of the
// "little by little" reveal. Polaroid frames don't have this problem
// (they're white, not black-outlined), which is one more reason they only
// live in the already-light "light zone" for now (see
// exhibitionFrames.ts's file header).
import Image from 'next/image'
import { EXHIBITION_FRAMES } from '@/data/exhibitionFrames'

export default function ImageExhibition() {
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
                style={{ fontFamily: 'var(--font-cedarville-cursive)', fontSize: 18 }}
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
