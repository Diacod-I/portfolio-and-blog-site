// Frame positions for the hidden "image exhibition" easter egg — see
// components/ImageExhibition.tsx and the hidden zone above the Home tab's
// normal starting position in HomeClient.tsx.
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
// Two zones, split by topPct (each frame's position within the 380vh
// gallery box — see HomeClient.tsx's own comment on that div):
//  - "Light zone" (topPct below ~47) — closer to the top of the hidden
//    zone, i.e. further into the scroll-up journey, where the
//    faulty-terminal dissolve (see uDissolveProgress in
//    FaultyTerminalBackground.tsx) has reliably finished revealing the
//    white/pink look by the time a frame here is actually on screen. Real
//    photos (the `src` field below) live here.
//  - "Dark zone" (topPct 50+) — reached earlier in the scroll-up journey,
//    while the background is still transitioning (or hasn't started) —
//    these stay plain black-outline placeholders (no `src`) for now, same
//    as this whole gallery originally shipped, since a real photo dropped
//    here would spend a while sitting against a partially-dark background
//    before the sweep (see FaultyTerminalBackground.tsx) catches up to it.
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
  /** Path under /public. Omitted → renders as a black-outline placeholder
   *  (see ImageExhibition.tsx) instead of a real photo/polaroid. */
  src?: string
  alt?: string
  /** Handwritten-style caption in the polaroid's bottom margin (see
   *  ImageExhibition.tsx's Cedarville Cursive text) — only meaningful
   *  alongside `src`. A short description of what's actually in the shot
   *  (or the file's embedded date, for the earlier batch that didn't get
   *  individually reviewed) — feel free to replace any of these with
   *  something more personal. */
  caption?: string
}

// widthPx/heightPx for every `src` frame below are the *photo* area only
// (ImageExhibition.tsx adds the white polaroid border/margin around it in
// CSS, not baked in here) — and deliberately NOT each photo's raw aspect
// ratio. A pure "no cropping" size produces absurdly thin slivers for very
// tall/narrow phone photos (one of these is naturally 1429x3508 — AR
// 0.41) once every frame also needs a plausible polaroid-card shape. Each
// photo's AR is clamped to [0.65, 1.4] here (typical portrait-to-
// slightly-landscape polaroid range), then object-cover (see
// ImageExhibition.tsx) crops just enough to fill that clamped box — a
// little content is cropped off the top/bottom of the most extreme
// photos, but nowhere near as much as forcing the raw AR into a normal-
// looking frame would have needed. Computed via Pillow, honoring EXIF
// orientation the same way a browser does — width/height base capped at
// 170px on the longer side.
//
// Positions/rotations for all 24 light-zone frames below came out of a
// one-off packing script (not hand-placed like the original 11 dark-zone
// placeholders still are): it lays out each frame's *rotated* bounding
// box — including the white polaroid border and caption strip, not just
// the photo — left-to-right in rows across an assumed ~1000px-wide
// window, with a fixed gap between every pair, then nudges each one by a
// few px of random jitter (bounded well under half that gap, so jitter
// alone can never close it) for a scattered rather than gridded look.
// That guarantees zero overlap *for that assumed window width* — a much
// narrower or shorter actual window than assumed could still bring frames
// closer together than intended, since these positions don't recompute
// live off the real window size the way, say, the sticky-image layout
// elsewhere on this page does. Fitting all 24 without overlap needed more
// vertical room than the gallery box previously had, which is why it went
// from 280vh to 380vh (see HomeClient.tsx) — 24 frames spread across
// ~1000px of width just needs more height than 11 did.
export const EXHIBITION_FRAMES: ExhibitionFrame[] = [
  // ---- Light zone: real photos (see the file header) ----
  { id: 'photo-01', leftPct: 37.7, topPct: 24.3, widthPx: 170, heightPx: 159, rotationDeg: 3,  src: '/IMG_20190103_071215.jpg', alt: 'A personal photo', caption: 'Jan 3, 2019' },
  { id: 'photo-02', leftPct: 43.1, topPct: 31.6, widthPx: 110, heightPx: 170, rotationDeg: -3, src: '/IMG_20190103_075939.jpg', alt: 'A personal photo', caption: 'Jan 3, 2019' },
  { id: 'photo-03', leftPct: 3.1,  topPct: 23.9, widthPx: 110, heightPx: 170, rotationDeg: 4,  src: '/IMG_20190103_080007.jpg', alt: 'A personal photo', caption: 'Jan 3, 2019' },
  { id: 'photo-04', leftPct: 3.0,  topPct: 1.0,  widthPx: 170, heightPx: 139, rotationDeg: 5,  src: '/IMG_20190103_081554.jpg', alt: 'A personal photo', caption: 'Jan 3, 2019' },
  { id: 'photo-05', leftPct: 66.6, topPct: 16.3, widthPx: 170, heightPx: 121, rotationDeg: 5,  src: '/IMG_20190103_082932.jpg', alt: 'A personal photo', caption: 'Jan 3, 2019' },
  { id: 'photo-06', leftPct: 25.1, topPct: 0.7,  widthPx: 110, heightPx: 170, rotationDeg: 4,  src: '/IMG_20211119_193920.jpg', alt: 'A personal photo', caption: 'Nov 19, 2021' },
  { id: 'photo-07', leftPct: 47.3, topPct: 16.4, widthPx: 128, heightPx: 170, rotationDeg: 5,  src: '/IMG_20211122_122534.jpg', alt: 'A personal photo', caption: 'Nov 22, 2021' },
  { id: 'photo-08', leftPct: 19.7, topPct: 39.3, widthPx: 170, heightPx: 121, rotationDeg: 3,  src: '/IMG_20220302_175741.jpg', alt: 'A personal photo', caption: 'Mar 2, 2022' },
  { id: 'photo-09', leftPct: 19.8, topPct: 24.3, widthPx: 127, heightPx: 170, rotationDeg: 4,  src: '/IMG_20220304_204353.jpg', alt: 'A personal photo', caption: 'Mar 4, 2022' },
  { id: 'photo-10', leftPct: 20.4, topPct: 8.6,  widthPx: 144, heightPx: 170, rotationDeg: -2, src: '/IMG_20220401_192335_737.jpg', alt: 'A personal photo', caption: 'Apr 1, 2022' },
  { id: 'photo-11', leftPct: 3.1,  topPct: 8.5,  widthPx: 128, heightPx: 170, rotationDeg: 3,  src: '/IMG_20231022_140633.jpg', alt: 'A personal photo', caption: 'Oct 22, 2023' },
  { id: 'photo-12', leftPct: 40.6, topPct: 8.5,  widthPx: 162, heightPx: 170, rotationDeg: -5, src: '/IMG_20240423_080639.jpg', alt: 'A personal photo', caption: 'Apr 23, 2024' },
  { id: 'photo-13', leftPct: 3.0,  topPct: 32.1, widthPx: 170, heightPx: 121, rotationDeg: -5, src: '/IMG_20240528_224218.jpg', alt: 'A personal photo', caption: 'May 28, 2024' },
  { id: 'photo-14', leftPct: 3.6,  topPct: 16.6, widthPx: 170, heightPx: 121, rotationDeg: -5, src: '/IMG_20240528_225351.jpg', alt: 'A personal photo', caption: 'May 28, 2024' },
  { id: 'photo-15', leftPct: 41.6, topPct: 1.0,  widthPx: 170, heightPx: 128, rotationDeg: -4, src: '/IMG_20240528_225753.jpg', alt: 'A personal photo', caption: 'May 28, 2024' },
  { id: 'photo-16', leftPct: 63.8, topPct: 0.8,  widthPx: 170, heightPx: 128, rotationDeg: -2, src: '/IMG_20240604_130801.jpg', alt: 'A personal photo', caption: 'Jun 4, 2024' },
  { id: 'photo-17', leftPct: 61.9, topPct: 8.5,  widthPx: 170, heightPx: 128, rotationDeg: -2, src: '/IMG_20250714_005009.jpg', alt: 'A personal photo', caption: 'Jul 14, 2025' },
  { id: 'photo-18', leftPct: 25.1, topPct: 16.7, widthPx: 170, heightPx: 128, rotationDeg: -4, src: '/IMG_0756.jpg', alt: 'A personal photo', caption: 'a doodle' },
  { id: 'photo-19', leftPct: 59.3, topPct: 31.9, widthPx: 128, heightPx: 170, rotationDeg: -3, src: '/05FCBBAF-CDA5-4B1B-922D-6426A9B6DBA3_1_105_c.jpeg', alt: 'A personal photo', caption: 'good morning' },
  { id: 'photo-20', leftPct: 77.8, topPct: 24.2, widthPx: 170, heightPx: 146, rotationDeg: -4, src: '/1109AEAE-CB76-481B-A0C5-637DF2636E1C_4_5005_c.jpeg', alt: 'A personal photo', caption: 'worth it?' },
  { id: 'photo-21', leftPct: 2.5,  topPct: 39.4, widthPx: 119, heightPx: 170, rotationDeg: 2,  src: '/112EEF32-B66D-49E5-9DB9-6BC6787AEF3D_1_105_c.jpeg', alt: 'A personal photo', caption: 'a portrait' },
  { id: 'photo-22', leftPct: 25.8, topPct: 31.8, widthPx: 128, heightPx: 170, rotationDeg: 2,  src: '/326387A0-CF8E-42C2-9F7A-87A04A5903D7_1_105_c.jpeg', alt: 'A personal photo', caption: 'browsing' },
  { id: 'photo-23', leftPct: 77.3, topPct: 31.9, widthPx: 170, heightPx: 128, rotationDeg: 2,  src: '/4443A26E-06E7-46C1-AF1B-D7058056D458_1_105_c.jpeg', alt: 'A personal photo', caption: 'night bloom' },
  { id: 'photo-24', leftPct: 59.4, topPct: 24.2, widthPx: 128, heightPx: 170, rotationDeg: -3, src: '/8DEE3877-00A4-4592-B09F-300D29B8A3EF_1_105_c.jpeg', alt: 'A personal photo', caption: 'whiteboarding' },

  // ---- Dark zone: still plain placeholder outlines (see the file header) ----
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
