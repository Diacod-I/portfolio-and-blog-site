'use client'

// Scattered black-outline placeholders for the hidden "image exhibition"
// easter egg (see the hidden zone above the Home tab's normal starting
// position in HomeClient.tsx) — no real images yet, just each frame's
// shape/position, absolutely placed and slightly rotated for a "hung
// unevenly on a gallery wall" feel rather than a tidy grid. Black borders
// specifically: this zone's background washes from the faulty-terminal
// shader's black backdrop up to white/pink the further up you scroll (see
// HomeClient.tsx's easterEggWashRef), so black frames start out invisible
// against the dark backdrop near the bottom of this zone and gradually
// reveal themselves as the wash lightens further up — not a bug, part of
// the "little by little" reveal.
import { EXHIBITION_FRAMES } from '@/data/exhibitionFrames'

export default function ImageExhibition() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {EXHIBITION_FRAMES.map((frame) => (
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
      ))}
    </div>
  )
}
