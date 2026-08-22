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
// "Light zone" / "dark zone" below just names the two topPct bands (each
// frame's position within the 380vh gallery box — see HomeClient.tsx's
// own comment on that div): "light zone" (topPct below ~47) is further
// into the scroll-up journey, where the faulty-terminal dissolve (see
// uDissolveProgress in FaultyTerminalBackground.tsx) has reliably
// finished revealing the white/pink look by the time a frame there is
// actually on screen; "dark zone" (topPct 50+) is reached earlier, while
// the background is still transitioning or hasn't started. Every frame
// is a real photo now (no bare placeholders left — see ImageExhibition.tsx
// for the still-supported fallback rendering if a future frame omits
// `src`), including in the dark zone: that used to be placeholder-only
// specifically because a black-outlined placeholder there would sit
// nearly invisible against the still-dark background, but a white
// polaroid card (what every `src` frame renders as now — see
// ImageExhibition.tsx) doesn't have that problem, so there's no reason
// left to hold real photos back from that band.
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
   *  alongside `src`. Every one of these is a short description of what's
   *  actually in the shot (not a date/timestamp — an earlier pass used the
   *  file's embedded date for a batch that hadn't been individually
   *  reviewed yet, but every frame's been looked at now) — feel free to
   *  replace any of these with something more personal. */
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
// Positions/rotations for the light-zone frames below (photo-01..24, plus
// photo-30..32 added in a later pass) came out of a one-off packing script
// (not hand-placed like the original 11 dark-zone placeholders still are):
// it lays out each frame's *rotated* bounding box — including the white
// polaroid border and caption strip, not just the photo — against every
// frame already placed, across an assumed ~1000px-wide by ~3040px-tall
// window (that height assumes an ~800px viewport times the zone's 380vh),
// leaving a fixed gap between every pair, then nudges each one by a few px
// of random jitter (bounded well under half that gap, so jitter alone can
// never close it) for a scattered rather than gridded look. That
// guarantees zero overlap *for that assumed window size* — a much
// narrower or shorter actual window than assumed could still bring frames
// closer together than intended, since these positions don't recompute
// live off the real window size the way, say, the sticky-image layout
// elsewhere on this page does. Fitting the original 24 without overlap
// needed more vertical room than the gallery box previously had, which is
// why it went from 280vh to 380vh (see HomeClient.tsx); photo-30..32 later
// fit into that same 0–47% topPct band without needing to grow it further.
export const EXHIBITION_FRAMES: ExhibitionFrame[] = [
  // ---- Light zone: real photos (see the file header) ----
  { id: 'photo-01', leftPct: 37.7, topPct: 24.3, widthPx: 170, heightPx: 159, rotationDeg: 3,  src: '/IMG_20190103_071215.jpg', alt: 'A personal photo', caption: 'caught mid-squat' },
  { id: 'photo-02', leftPct: 43.1, topPct: 31.6, widthPx: 110, heightPx: 170, rotationDeg: -3, src: '/IMG_20190103_075939.jpg', alt: 'A personal photo', caption: 'a camel, apparently' },
  { id: 'photo-03', leftPct: 3.1,  topPct: 23.9, widthPx: 110, heightPx: 170, rotationDeg: 4,  src: '/IMG_20190103_080007.jpg', alt: 'A personal photo', caption: 'little bandana' },
  { id: 'photo-04', leftPct: 3.0,  topPct: 1.0,  widthPx: 170, heightPx: 139, rotationDeg: 5,  src: '/IMG_20190103_081554.jpg', alt: 'A personal photo', caption: 'goofing off' },
  { id: 'photo-05', leftPct: 66.6, topPct: 16.3, widthPx: 170, heightPx: 121, rotationDeg: 5,  src: '/IMG_20190103_082932.jpg', alt: 'A personal photo', caption: 'meeting grandma' },
  { id: 'photo-06', leftPct: 25.1, topPct: 0.7,  widthPx: 110, heightPx: 170, rotationDeg: 4,  src: '/IMG_20211119_193920.jpg', alt: 'A personal photo', caption: 'drip check' },
  { id: 'photo-07', leftPct: 47.3, topPct: 16.4, widthPx: 128, heightPx: 170, rotationDeg: 5,  src: '/IMG_20211122_122534.jpg', alt: 'A personal photo', caption: 'a sketch' },
  { id: 'photo-08', leftPct: 19.7, topPct: 39.3, widthPx: 170, heightPx: 121, rotationDeg: 3,  src: '/IMG_20220302_175741.jpg', alt: 'A personal photo', caption: 'a plant, a slide' },
  { id: 'photo-09', leftPct: 19.8, topPct: 24.3, widthPx: 127, heightPx: 170, rotationDeg: 4,  src: '/IMG_20220304_204353.jpg', alt: 'A personal photo', caption: 'dried flowers' },
  { id: 'photo-10', leftPct: 20.4, topPct: 8.6,  widthPx: 144, heightPx: 170, rotationDeg: -2, src: '/IMG_20220401_192335_737.jpg', alt: 'A personal photo', caption: 'reading my palm' },
  { id: 'photo-11', leftPct: 3.1,  topPct: 8.5,  widthPx: 128, heightPx: 170, rotationDeg: 3,  src: '/IMG_20231022_140633.jpg', alt: 'A personal photo', caption: 'the honest fourier transform' },
  { id: 'photo-12', leftPct: 40.6, topPct: 8.5,  widthPx: 162, heightPx: 170, rotationDeg: -5, src: '/IMG_20240423_080639.jpg', alt: 'A personal photo', caption: 'step 1' },
  { id: 'photo-13', leftPct: 3.0,  topPct: 32.1, widthPx: 170, heightPx: 121, rotationDeg: -5, src: '/IMG_20240528_224218.jpg', alt: 'A personal photo', caption: 'a duel' },
  { id: 'photo-14', leftPct: 3.6,  topPct: 16.6, widthPx: 170, heightPx: 121, rotationDeg: -5, src: '/IMG_20240528_225351.jpg', alt: 'A personal photo', caption: 'praying hands' },
  { id: 'photo-15', leftPct: 41.6, topPct: 1.0,  widthPx: 170, heightPx: 128, rotationDeg: -4, src: '/IMG_20240528_225753.jpg', alt: 'A personal photo', caption: 'holding the world' },
  { id: 'photo-16', leftPct: 63.8, topPct: 0.8,  widthPx: 170, heightPx: 128, rotationDeg: -2, src: '/IMG_20240604_130801.jpg', alt: 'A personal photo', caption: 'drawing from a photo' },
  { id: 'photo-17', leftPct: 61.9, topPct: 8.5,  widthPx: 170, heightPx: 128, rotationDeg: -2, src: '/IMG_20250714_005009.jpg', alt: 'A personal photo', caption: 'just the eyes' },
  { id: 'photo-18', leftPct: 25.1, topPct: 16.7, widthPx: 170, heightPx: 128, rotationDeg: -4, src: '/IMG_0756.jpg', alt: 'A personal photo', caption: 'a doodle' },
  { id: 'photo-19', leftPct: 59.3, topPct: 31.9, widthPx: 128, heightPx: 170, rotationDeg: -3, src: '/05FCBBAF-CDA5-4B1B-922D-6426A9B6DBA3_1_105_c.jpeg', alt: 'A personal photo', caption: 'good morning' },
  { id: 'photo-20', leftPct: 77.8, topPct: 24.2, widthPx: 170, heightPx: 146, rotationDeg: -4, src: '/1109AEAE-CB76-481B-A0C5-637DF2636E1C_4_5005_c.jpeg', alt: 'A personal photo', caption: 'worth it?' },
  { id: 'photo-21', leftPct: 2.5,  topPct: 39.4, widthPx: 119, heightPx: 170, rotationDeg: 2,  src: '/112EEF32-B66D-49E5-9DB9-6BC6787AEF3D_1_105_c.jpeg', alt: 'A personal photo', caption: 'a portrait' },
  { id: 'photo-22', leftPct: 25.8, topPct: 31.8, widthPx: 128, heightPx: 170, rotationDeg: 2,  src: '/326387A0-CF8E-42C2-9F7A-87A04A5903D7_1_105_c.jpeg', alt: 'A personal photo', caption: 'browsing' },
  { id: 'photo-23', leftPct: 77.3, topPct: 31.9, widthPx: 170, heightPx: 128, rotationDeg: 2,  src: '/4443A26E-06E7-46C1-AF1B-D7058056D458_1_105_c.jpeg', alt: 'A personal photo', caption: 'night bloom' },
  { id: 'photo-24', leftPct: 59.4, topPct: 24.2, widthPx: 128, heightPx: 170, rotationDeg: -3, src: '/8DEE3877-00A4-4592-B09F-300D29B8A3EF_1_105_c.jpeg', alt: 'A personal photo', caption: 'whiteboarding' },
  // Three more added later (see file header on the density gradient this
  // preserves): packed into this same light zone, not the dark zone below —
  // the dark zone is deliberately sparse ("as it is now") and this zone is
  // deliberately dense, so new photos keep going here. Placed by the same
  // rotated-AABB packing approach, checked pairwise against all 24 frames
  // above (zero overlap) rather than hand-placed.
  { id: 'photo-30', leftPct: 77.2, topPct: 38.8, widthPx: 170, heightPx: 128, rotationDeg: -2, src: '/19F77ED7-2604-454D-A740-32B2120BB4EE_1_105_c.jpeg', alt: 'A personal photo', caption: 'red bloom' },
  { id: 'photo-31', leftPct: 83.6, topPct: 7.4,  widthPx: 128, heightPx: 170, rotationDeg: -1, src: '/22152C98-2AA8-4B6F-A831-85BB4A86EA72_1_105_c.jpeg', alt: 'A personal photo', caption: 'flower for me' },
  { id: 'photo-32', leftPct: 41.7, topPct: 40.2, widthPx: 128, heightPx: 170, rotationDeg: -2, src: '/E71A0C45-4BA0-42AB-8B15-D2EBFA7A2AB9_1_105_c.jpeg', alt: 'A personal photo', caption: 'golden hour' },

  // ---- Dark zone: previously 5 bare black-outline placeholders
  // (frame-07..frame-11) at these same leftPct/topPct spots — replaced
  // with real photos (duplicates of 5 already used above; nothing left
  // unused to fill these with) rather than leaving them empty, now that
  // there's no visibility problem stopping real photos from going here
  // (see the file header). Deliberately kept at the SAME leftPct/topPct
  // as the placeholders they replaced, just with widthPx/heightPx swapped
  // to each chosen photo's own clamped size — this keeps
  // EXHIBITION_FRAMES_MAX_TOP_PCT (and the dead-zone pacing derived from
  // it in HomeClient.tsx) unchanged, rather than shrinking it as a side
  // effect of the new frames happening to need less vertical spread than
  // the placeholders did. Checked pairwise against each other's rotated
  // bounding box (padding + caption strip included) for overlap at the
  // same assumed ~1000px window width the light zone's packing script
  // used — zero collisions there. ----
  { id: 'photo-25', leftPct: 18, topPct: 50, widthPx: 128, heightPx: 170, rotationDeg: 4,  src: '/05FCBBAF-CDA5-4B1B-922D-6426A9B6DBA3_1_105_c.jpeg', alt: 'A personal photo', caption: 'good morning' },
  { id: 'photo-26', leftPct: 68, topPct: 52, widthPx: 170, heightPx: 128, rotationDeg: -5, src: '/4443A26E-06E7-46C1-AF1B-D7058056D458_1_105_c.jpeg', alt: 'A personal photo', caption: 'night bloom' },
  { id: 'photo-27', leftPct: 38, topPct: 66, widthPx: 128, heightPx: 170, rotationDeg: 1,  src: '/8DEE3877-00A4-4592-B09F-300D29B8A3EF_1_105_c.jpeg', alt: 'A personal photo', caption: 'whiteboarding' },
  { id: 'photo-28', leftPct: 8,  topPct: 76, widthPx: 170, heightPx: 159, rotationDeg: -3, src: '/IMG_20190103_071215.jpg', alt: 'A personal photo', caption: 'caught mid-squat' },
  { id: 'photo-29', leftPct: 62, topPct: 78, widthPx: 162, heightPx: 170, rotationDeg: 3,  src: '/IMG_20240423_080639.jpg', alt: 'A personal photo', caption: 'step 1' },
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
