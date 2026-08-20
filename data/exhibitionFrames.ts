// Placeholder positions for the hidden "image exhibition" easter egg —
// see components/ImageExhibition.tsx and the hidden zone above the Home
// tab's normal starting position in HomeClient.tsx.
//
// Fixed/hardcoded rather than randomly generated at render time:
// generating truly random positions during render would differ between
// the server's render and the client's first render (Math.random() isn't
// deterministic across that boundary), causing a hydration mismatch and a
// jarring jump once React corrects it. A fixed "random-looking" layout
// avoids that entirely while still reading as scattered/uneven rather than
// a tidy grid — see the "Scattered/absolute (gallery wall feel)" framing
// this was built to.
//
// No real images yet — just each frame's shape (position/size/rotation).
// Add a `src` field and an <Image> in ImageExhibition.tsx later without
// touching this layout.
export type ExhibitionFrame = {
  id: string
  /** Percent of the exhibition zone's own width/height (the zone is
   *  position: relative, full width of the window, so these are relative
   *  to that, not the viewport). */
  leftPct: number
  topPct: number
  widthPx: number
  heightPx: number
  rotationDeg: number
}

export const EXHIBITION_FRAMES: ExhibitionFrame[] = [
  { id: 'frame-01', leftPct: 6,  topPct: 4,  widthPx: 170, heightPx: 210, rotationDeg: -4 },
  { id: 'frame-02', leftPct: 58, topPct: 3,  widthPx: 210, heightPx: 150, rotationDeg: 3 },
  { id: 'frame-03', leftPct: 32, topPct: 14, widthPx: 140, heightPx: 180, rotationDeg: 2 },
  { id: 'frame-04', leftPct: 76, topPct: 20, widthPx: 160, heightPx: 200, rotationDeg: -3 },
  { id: 'frame-05', leftPct: 4,  topPct: 30, widthPx: 190, heightPx: 140, rotationDeg: 5 },
  { id: 'frame-06', leftPct: 46, topPct: 34, widthPx: 180, heightPx: 230, rotationDeg: -2 },
  { id: 'frame-07', leftPct: 18, topPct: 50, widthPx: 150, heightPx: 190, rotationDeg: 4 },
  { id: 'frame-08', leftPct: 68, topPct: 52, widthPx: 200, heightPx: 160, rotationDeg: -5 },
  { id: 'frame-09', leftPct: 38, topPct: 66, widthPx: 170, heightPx: 210, rotationDeg: 1 },
  { id: 'frame-10', leftPct: 8,  topPct: 76, widthPx: 140, heightPx: 170, rotationDeg: -3 },
  { id: 'frame-11', leftPct: 62, topPct: 78, widthPx: 190, heightPx: 150, rotationDeg: 3 },
]

// The frame closest to the *bottom* of the zone (largest topPct) is the
// first one a user scrolling up from the resting position actually
// reaches — see HomeClient.tsx's EASTER_EGG_DEAD_ZONE_FRACTION, which is
// derived from this so the faulty-terminal dissolve starts right around
// when the gallery itself starts, instead of at an arbitrary fraction of
// the scroll range that has no relationship to where the frames actually
// are. Computed here (not hand-copied into HomeClient.tsx) so moving or
// adding frames later automatically keeps the two in sync.
export const EXHIBITION_FRAMES_MAX_TOP_PCT = Math.max(...EXHIBITION_FRAMES.map((f) => f.topPct))
