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
// own comment on that div): "light zone" (topPct up to ~51) is further
// into the scroll-up journey, where the faulty-terminal dissolve (see
// uDissolveProgress in FaultyTerminalBackground.tsx) has reliably
// finished revealing the white/pink look by the time a frame there is
// actually on screen; "dark zone" (topPct 55+) is reached earlier, while
// the background is still transitioning or hasn't started. Every frame is
// a real image — no bare placeholders left (see ImageExhibition.tsx for
// the still-supported fallback rendering if a future frame omits `src`).
// Every `src` below is unique — no photo appears twice. An earlier pass
// filled the dark zone by duplicating 5 light-zone photos (nothing unused
// was left at the time); once more images were added, those duplicates
// were swapped out for genuinely new, unique ones instead, per an explicit
// "no repeats" request.
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
// Positions/rotations for every frame below came out of a one-off
// scatter-placement script (not hand-placed, and — as of this pass — not
// a row-by-row shelf-packing script either, since that read as too
// grid-like once there were enough frames to fill several full rows): for
// each frame, in a shuffled order, it tries fully random (left, top,
// rotation) triples within that frame's zone until it finds one whose
// *rotated* bounding box — including the white polaroid border and
// caption strip, not just the photo — doesn't come within a fixed gap of
// any frame already placed, against an assumed ~1000px-wide by ~3040px-
// tall window (that height assumes an ~800px viewport times the zone's
// 380vh). Random-until-it-fits naturally avoids the aligned-row look a
// shelf packer produces, at the cost of needing many attempts per frame
// as the zone fills up — the script let the light zone's search range
// creep a few percent past its initial 45% ceiling where needed (up to
// 51%) rather than fail outright once the easy space ran out. That
// guarantees zero overlap *for that assumed window size* — a much
// narrower or shorter actual window than assumed could still bring frames
// closer together than intended, since these positions don't recompute
// live off the real window size the way, say, the sticky-image layout
// elsewhere on this page does. Fitting all the light-zone frames without
// overlap needed the 380vh of vertical room the gallery box already has
// (see HomeClient.tsx) — no further growth needed for this pass.
export const EXHIBITION_FRAMES: ExhibitionFrame[] = [
  // ---- Light zone: dense — every personal photo (see the file header) ----
  { id: 'photo-01', leftPct: 22.4, topPct: 35.8, widthPx: 170, heightPx: 159, rotationDeg: 1.9,  src: '/IMG_20190103_071215.jpg', alt: 'A personal photo', caption: 'caught mid-squat' },
  { id: 'photo-02', leftPct: 86.8, topPct: 20.5, widthPx: 110, heightPx: 170, rotationDeg: 0.4,  src: '/IMG_20190103_075939.jpg', alt: 'A personal photo', caption: 'a camel, apparently' },
  { id: 'photo-03', leftPct: 45.4, topPct: 8.9,  widthPx: 110, heightPx: 170, rotationDeg: -0.4, src: '/IMG_20190103_080007.jpg', alt: 'A personal photo', caption: 'little bandana' },
  { id: 'photo-04', leftPct: 76.6, topPct: 32.2, widthPx: 170, heightPx: 139, rotationDeg: 0.2,  src: '/IMG_20190103_081554.jpg', alt: 'A personal photo', caption: 'goofing off' },
  { id: 'photo-05', leftPct: 31.3, topPct: 50.7, widthPx: 170, heightPx: 121, rotationDeg: -0.7, src: '/IMG_20190103_082932.jpg', alt: 'A personal photo', caption: 'meeting grandma' },
  { id: 'photo-06', leftPct: 87.2, topPct: 42.0, widthPx: 110, heightPx: 170, rotationDeg: 0.0,  src: '/IMG_20211119_193920.jpg', alt: 'A personal photo', caption: 'drip check' },
  { id: 'photo-07', leftPct: 24.2, topPct: 5.6,  widthPx: 128, heightPx: 170, rotationDeg: 0.6,  src: '/IMG_20211122_122534.jpg', alt: 'A personal photo', caption: 'a sketch' },
  { id: 'photo-08', leftPct: 60.6, topPct: 7.0,  widthPx: 170, heightPx: 121, rotationDeg: 0.2,  src: '/IMG_20220302_175741.jpg', alt: 'A personal photo', caption: 'a plant, a slide' },
  { id: 'photo-09', leftPct: 43.1, topPct: 0.1,  widthPx: 127, heightPx: 170, rotationDeg: 2.5,  src: '/IMG_20220304_204353.jpg', alt: 'A personal photo', caption: 'dried flowers' },
  { id: 'photo-10', leftPct: 2.5,  topPct: 49.1, widthPx: 144, heightPx: 170, rotationDeg: 1.1,  src: '/IMG_20220401_192335_737.jpg', alt: 'A personal photo', caption: 'reading my palm' },
  { id: 'photo-11', leftPct: 83.6, topPct: 0.4,  widthPx: 128, heightPx: 170, rotationDeg: 1.0,  src: '/IMG_20231022_140633.jpg', alt: 'A personal photo', caption: 'the honest fourier transform' },
  { id: 'photo-12', leftPct: 3.8,  topPct: 5.1,  widthPx: 162, heightPx: 170, rotationDeg: 1.9,  src: '/IMG_20240423_080639.jpg', alt: 'A personal photo', caption: 'step 1' },
  { id: 'photo-13', leftPct: 50.4, topPct: 41.0, widthPx: 170, heightPx: 121, rotationDeg: 4.9,  src: '/IMG_20240528_224218.jpg', alt: 'A personal photo', caption: 'a duel' },
  { id: 'photo-14', leftPct: 65.7, topPct: 20.9, widthPx: 170, heightPx: 121, rotationDeg: -1.7, src: '/IMG_20240528_225351.jpg', alt: 'A personal photo', caption: 'praying hands' },
  { id: 'photo-15', leftPct: 13.6, topPct: 14.7, widthPx: 170, heightPx: 128, rotationDeg: -2.5, src: '/IMG_20240528_225753.jpg', alt: 'A personal photo', caption: 'holding the world' },
  { id: 'photo-16', leftPct: 62.1, topPct: 0.2,  widthPx: 170, heightPx: 128, rotationDeg: 2.3,  src: '/IMG_20240604_130801.jpg', alt: 'A personal photo', caption: 'drawing from a photo' },
  { id: 'photo-17', leftPct: 23.2, topPct: 43.7, widthPx: 170, heightPx: 128, rotationDeg: -0.4, src: '/IMG_20250714_005009.jpg', alt: 'A personal photo', caption: 'just the eyes' },
  { id: 'photo-18', leftPct: 32.7, topPct: 27.3, widthPx: 170, heightPx: 128, rotationDeg: 3.2,  src: '/IMG_0756.jpg', alt: 'A personal photo', caption: 'a doodle' },
  { id: 'photo-19', leftPct: 59.0, topPct: 28.4, widthPx: 128, heightPx: 170, rotationDeg: 4.2,  src: '/05FCBBAF-CDA5-4B1B-922D-6426A9B6DBA3_1_105_c.jpeg', alt: 'A personal photo', caption: 'good morning' },
  { id: 'photo-20', leftPct: 8.9,  topPct: 21.9, widthPx: 170, heightPx: 146, rotationDeg: -5.0, src: '/1109AEAE-CB76-481B-A0C5-637DF2636E1C_4_5005_c.jpeg', alt: 'A personal photo', caption: 'worth it?' },
  { id: 'photo-21', leftPct: 85.5, topPct: 50.4, widthPx: 119, heightPx: 170, rotationDeg: 0.3,  src: '/112EEF32-B66D-49E5-9DB9-6BC6787AEF3D_1_105_c.jpeg', alt: 'A personal photo', caption: 'a portrait' },
  { id: 'photo-22', leftPct: 2.4,  topPct: 29.6, widthPx: 128, heightPx: 170, rotationDeg: -1.5, src: '/326387A0-CF8E-42C2-9F7A-87A04A5903D7_1_105_c.jpeg', alt: 'A personal photo', caption: 'browsing' },
  { id: 'photo-23', leftPct: 64.2, topPct: 47.6, widthPx: 170, heightPx: 128, rotationDeg: -3.5, src: '/4443A26E-06E7-46C1-AF1B-D7058056D458_1_105_c.jpeg', alt: 'A personal photo', caption: 'night bloom' },
  { id: 'photo-24', leftPct: 81.8, topPct: 12.5, widthPx: 128, heightPx: 170, rotationDeg: -2.5, src: '/8DEE3877-00A4-4592-B09F-300D29B8A3EF_1_105_c.jpeg', alt: 'A personal photo', caption: 'whiteboarding' },
  { id: 'photo-30', leftPct: 60.4, topPct: 13.6, widthPx: 170, heightPx: 128, rotationDeg: -1.8, src: '/19F77ED7-2604-454D-A740-32B2120BB4EE_1_105_c.jpeg', alt: 'A personal photo', caption: 'red bloom' },
  { id: 'photo-31', leftPct: 0.7,  topPct: 40.5, widthPx: 128, heightPx: 170, rotationDeg: 2.1,  src: '/22152C98-2AA8-4B6F-A831-85BB4A86EA72_1_105_c.jpeg', alt: 'A personal photo', caption: 'flower for me' },
  { id: 'photo-32', leftPct: 37.3, topPct: 17.4, widthPx: 128, heightPx: 170, rotationDeg: 2.8,  src: '/E71A0C45-4BA0-42AB-8B15-D2EBFA7A2AB9_1_105_c.jpeg', alt: 'A personal photo', caption: 'golden hour' },

  // ---- Dark zone: sparse — this batch is a handful of downloaded
  // pictures (not personal photos) the same "add whatever's new, caption
  // it after actually looking at it" treatment applied to, placed well
  // clear of the light zone above (topPct 55+) so the two bands stay
  // visually distinct. Previously this zone held 5 frames that were exact
  // duplicates of photos already used above (there was nothing else
  // unused at the time); those were removed once these 4 unique images
  // were available, since repeating a photo elsewhere in the gallery was
  // no longer necessary and explicitly not wanted. ----
  { id: 'photo-33', leftPct: 61.7, topPct: 59.8, widthPx: 111, heightPx: 170, rotationDeg: -1.9, src: '/8eqko4.png', alt: 'A black-and-white manga illustration', caption: 'all might' },
  { id: 'photo-34', leftPct: 52.9, topPct: 85.8, widthPx: 170, heightPx: 128, rotationDeg: 3.9,  src: '/hqdefault.jpg', alt: 'An anime screenshot', caption: 'za warudo' },
  { id: 'photo-35', leftPct: 38.8, topPct: 68.7, widthPx: 135, heightPx: 170, rotationDeg: 2.3,  src: '/images.jpeg', alt: 'An anime screenshot with a golden-ratio overlay', caption: 'the golden ratio' },
  { id: 'photo-36', leftPct: 67.5, topPct: 77.6, widthPx: 170, heightPx: 121, rotationDeg: -4.5, src: '/maxresdefault.jpg', alt: 'A video game screenshot', caption: 'yakuza' },
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
