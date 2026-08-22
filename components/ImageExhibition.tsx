'use client'

// Scattered frames for the hidden "image exhibition" easter egg (see the
// hidden zone above the Home tab's normal starting position in
// HomeClient.tsx), absolutely placed and slightly rotated for a "hung
// unevenly on a gallery wall" feel rather than a tidy grid. Frames with a
// `src` (see data/exhibitionFrames.ts) render the real photo via
// next/image; frames without one still fall back to the original
// black-outline placeholder.
//
// Black borders specifically (both real photos and placeholders): this
// zone's background washes from the faulty-terminal shader's black
// backdrop up to white/pink the further up you scroll (see
// uDissolveProgress in FaultyTerminalBackground.tsx), so a black-bordered
// frame low in the zone starts out nearly blended into the dark backdrop
// and gradually stands out as the wash lightens further up — not a bug,
// part of the "little by little" reveal. That's also why every real photo
// so far sits in the "light zone" (see exhibitionFrames.ts's file header)
// rather than mixed in with the still-placeholder "dark zone" frames.
//
// object-contain, not object-cover: each frame's own widthPx/heightPx in
// exhibitionFrames.ts is already that photo's real aspect ratio (scaled
// down, not cropped), so the frame box and the image should match almost
// exactly — contain just guarantees no cropping ever happens even if a
// size was off by a rounding pixel or two, rather than cover silently
// slicing off an edge.
import Image from 'next/image'
import { EXHIBITION_FRAMES } from '@/data/exhibitionFrames'

export default function ImageExhibition() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {EXHIBITION_FRAMES.map((frame) => (
        <div
          key={frame.id}
          className="absolute border-2 border-black overflow-hidden flex items-center justify-center bg-black"
          style={{
            left: `${frame.leftPct}%`,
            top: `${frame.topPct}%`,
            width: frame.widthPx,
            height: frame.heightPx,
            transform: `rotate(${frame.rotationDeg}deg)`,
          }}
        >
          {frame.src ? (
            <Image
              src={frame.src}
              alt={frame.alt ?? ''}
              fill
              sizes="200px"
              className="object-contain"
            />
          ) : (
            <span className="text-black/40 text-[10px] font-mono text-center px-2">
              Image placeholder
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
