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
// own comment on that div): "light zone" (topPct up to ~62 now) is
// further into the scroll-up journey, where the faulty-terminal dissolve
// (see uDissolveProgress in FaultyTerminalBackground.tsx) has reliably
// finished revealing the white/pink look by the time a frame there is
// actually on screen; "dark zone" (topPct 70+) is reached earlier, while
// the background is still transitioning or hasn't started. This is a
// density split, not a content split — both zones mix personal photos
// with the handful of downloaded (non-personal) images; see the "moved"
// note above the dark-zone frames below for why a few personal photos
// specifically ended up down there. Every frame is a real image — no bare
// placeholders left (see ImageExhibition.tsx for the still-supported
// fallback rendering if a future frame omits `src`), and every `src` is
// unique — no photo appears twice (an earlier pass filled the dark zone
// by duplicating light-zone photos when nothing else was unused yet;
// once more images existed, those duplicates were swapped out per an
// explicit "no repeats" request).
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
   *  ImageExhibition.tsx's Edu NSW/ACT Cursive text) — only meaningful
   *  alongside `src`. Every one of these is a short description of what's
   *  actually in the shot (not a date/timestamp — an earlier pass used the
   *  file's embedded date for a batch that hadn't been individually
   *  reviewed yet, but every frame's been looked at now) — feel free to
   *  replace any of these with something more personal. */
  caption?: string
}

// widthPx/heightPx for every `src` frame below are the *photo* area only
// (ImageExhibition.tsx adds the white polaroid border/margin around it in
// CSS, not baked in here) — each one is that photo's real aspect ratio
// (via Pillow, honoring EXIF orientation the same way a browser does),
// just capped at 170px on the longer side, nothing more. An earlier
// version clamped every AR into a fixed [0.65, 1.4] "plausible polaroid"
// range before sizing the box, then relied on object-cover (see
// ImageExhibition.tsx) to crop off whatever didn't fit — that worked fine
// for photos already close to that range, but visibly cropped the top or
// bottom off anything more extreme (a couple of these are naturally
// portrait phone photos around AR 0.4, nowhere near the 0.65 floor).
// Switched to sizing each box to the photo's own real AR instead — no
// clamping, so object-cover has (almost) nothing left to crop and the
// full photo shows, at the cost of some frames now being much
// narrower/shorter than others (the most extreme here ranges from a
// 67px-wide sliver up to a 170px-wide landscape shot) rather than all
// landing in a similar polaroid-ish shape.
//
// Positions/rotations for every frame below came out of a one-off
// scatter-placement script (not hand-placed, and not a row-by-row
// shelf-packing script either, since that read as too grid-like once
// there were enough frames to fill several full rows): for each frame,
// in a shuffled order, it tries fully random (left, top, rotation)
// triples within that frame's zone until it finds one whose *rotated*
// bounding box — including the white polaroid border and caption strip,
// not just the photo — doesn't come within a fixed gap of any frame
// already placed, against an assumed ~1000px-wide by ~3040px-tall window
// (that height assumes an ~800px viewport times the zone's 380vh).
// Random-until-it-fits naturally avoids the aligned-row look a shelf
// packer produces, at the cost of needing many attempts per frame as the
// zone fills up — the script lets a zone's search range creep past its
// initial ceiling a few percent at a time where needed rather than fail
// outright once the easy space runs out (the light zone's ceiling ended
// up around 62% this pass, versus roughly 51% before the AR-unclamping
// above made several boxes bigger). That guarantees zero overlap *for
// that assumed window size* — a much narrower or shorter actual window
// than assumed could still bring frames closer together than intended,
// since these positions don't recompute live off the real window size
// the way, say, the sticky-image layout elsewhere on this page does.
// Fitting everything without overlap still fits inside the 380vh of
// vertical room the gallery box already has (see HomeClient.tsx) — no
// further growth needed for this pass.
export const EXHIBITION_FRAMES: ExhibitionFrame[] = [
  // ---- Light zone: dense — mostly personal photos, plus the 4
  // downloaded images mixed in among them rather than kept in their own
  // separate cluster (see the swap note below the dark zone). ----
  { id: 'photo-01', leftPct: 10.3, topPct: 48.0, widthPx: 170, heightPx: 159, rotationDeg: -3.1, src: '/IMG_20190103_071215.jpg', alt: 'A personal photo', caption: ':P' },
  { id: 'photo-02', leftPct: 61.6, topPct: 38.2, widthPx: 69,  heightPx: 170, rotationDeg: 2.1,  src: '/IMG_20190103_075939.jpg', alt: 'A personal photo', caption: 'kangaroo' },
  { id: 'photo-03', leftPct: 2.0,  topPct: 27.8, widthPx: 67,  heightPx: 170, rotationDeg: 2.1,  src: '/IMG_20190103_080007.jpg', alt: 'A personal photo', caption: ':)' },
  { id: 'photo-04', leftPct: 31.4, topPct: 22.0, widthPx: 170, heightPx: 139, rotationDeg: -1.7, src: '/IMG_20190103_081554.jpg', alt: 'A personal photo', caption: 'too loud aaaa' },
  { id: 'photo-05', leftPct: 68.1, topPct: 15.6, widthPx: 170, heightPx: 108, rotationDeg: 1.4,  src: '/IMG_20190103_082932.jpg', alt: 'A personal photo', caption: 'love you mom' },
  { id: 'photo-06', leftPct: 44.1, topPct: 2.4,  widthPx: 104, heightPx: 170, rotationDeg: -1.7, src: '/IMG_20211119_193920.jpg', alt: 'A personal photo', caption: 'drip check' },
  { id: 'photo-07', leftPct: 81.3, topPct: 26.8, widthPx: 128, heightPx: 170, rotationDeg: -1.8, src: '/IMG_20211122_122534.jpg', alt: 'A personal photo', caption: 'first startup idea' },
  { id: 'photo-08', leftPct: 38.2, topPct: 29.5, widthPx: 170, heightPx: 65,  rotationDeg: 1.9,  src: '/IMG_20220302_175741.jpg', alt: 'A personal photo', caption: 'This is Pachi' },
  { id: 'photo-09', leftPct: 42.1, topPct: 53.4, widthPx: 127, heightPx: 170, rotationDeg: 2.0,  src: '/IMG_20220304_204353.jpg', alt: 'A personal photo', caption: 'Prolly a fractal' },
  { id: 'photo-10', leftPct: 1.4,  topPct: 19.0, widthPx: 144, heightPx: 170, rotationDeg: -4.5, src: '/IMG_20220401_192335_737.jpg', alt: 'A personal photo', caption: 'magic' },
  { id: 'photo-12', leftPct: 78.7, topPct: 43.6, widthPx: 162, heightPx: 170, rotationDeg: 0.5,  src: '/IMG_20240423_080639.jpg', alt: 'A personal photo', caption: 'gotta grind' },
  { id: 'photo-16', leftPct: 78.5, topPct: 53.3, widthPx: 170, heightPx: 128, rotationDeg: -1.6, src: '/IMG_20240604_130801.jpg', alt: 'A personal photo', caption: 'if you know, you know' },
  { id: 'photo-17', leftPct: 13.2, topPct: 56.0, widthPx: 170, heightPx: 128, rotationDeg: 0.3,  src: '/IMG_20250714_005009.jpg', alt: 'A personal photo', caption: 'do I need to explain?' },
  { id: 'photo-18', leftPct: 63.8, topPct: 59.8, widthPx: 170, heightPx: 128, rotationDeg: 1.0,  src: '/IMG_0756.jpg', alt: 'A personal photo', caption: 'a doodle' },
  { id: 'photo-19', leftPct: 60.5, topPct: 47.5, widthPx: 128, heightPx: 170, rotationDeg: -3.2, src: '/05FCBBAF-CDA5-4B1B-922D-6426A9B6DBA3_1_105_c.jpeg', alt: 'A personal photo', caption: 'good morning' },
  { id: 'photo-20', leftPct: 24.8, topPct: 12.5, widthPx: 170, heightPx: 146, rotationDeg: 2.5,  src: '/1109AEAE-CB76-481B-A0C5-637DF2636E1C_4_5005_c.jpeg', alt: 'A personal photo', caption: 'worth it?' },
  { id: 'photo-21', leftPct: 71.0, topPct: 5.2,  widthPx: 119, heightPx: 170, rotationDeg: 4.1,  src: '/112EEF32-B66D-49E5-9DB9-6BC6787AEF3D_1_105_c.jpeg', alt: 'A personal photo', caption: 'portrait made with love <3' },
  { id: 'photo-22', leftPct: 62.7, topPct: 22.8, widthPx: 128, heightPx: 170, rotationDeg: 2.2,  src: '/326387A0-CF8E-42C2-9F7A-87A04A5903D7_1_105_c.jpeg', alt: 'A personal photo', caption: 'browsing' },
  { id: 'photo-23', leftPct: 16.0, topPct: 5.8,  widthPx: 170, heightPx: 128, rotationDeg: 4.2,  src: '/4443A26E-06E7-46C1-AF1B-D7058056D458_1_105_c.jpeg', alt: 'A personal photo', caption: 'night bloom' },
  { id: 'photo-24', leftPct: 14.5, topPct: 30.2, widthPx: 128, heightPx: 170, rotationDeg: -0.4, src: '/8DEE3877-00A4-4592-B09F-300D29B8A3EF_1_105_c.jpeg', alt: 'A personal photo', caption: 'whiteboarding' },
  { id: 'photo-30', leftPct: 36.1, topPct: 36.0, widthPx: 170, heightPx: 128, rotationDeg: -4.4, src: '/19F77ED7-2604-454D-A740-32B2120BB4EE_1_105_c.jpeg', alt: 'A personal photo', caption: 'roses are red or some shit' },
  { id: 'photo-31', leftPct: 75.6, topPct: 35.8, widthPx: 128, heightPx: 170, rotationDeg: -1.2, src: '/22152C98-2AA8-4B6F-A831-85BB4A86EA72_1_105_c.jpeg', alt: 'A personal photo', caption: 'pookie phase (ongoing)' },
  { id: 'photo-32', leftPct: 46.4, topPct: 12.3, widthPx: 128, heightPx: 170, rotationDeg: -2.2, src: '/E71A0C45-4BA0-42AB-8B15-D2EBFA7A2AB9_1_105_c.jpeg', alt: 'A personal photo', caption: 'golden hour' },
  { id: 'photo-33', leftPct: 33.3, topPct: 43.5, widthPx: 110, heightPx: 170, rotationDeg: -4.5, src: '/8eqko4.png', alt: 'A black-and-white manga illustration', caption: 'the goat' },
  { id: 'photo-34', leftPct: 35.4, topPct: 61.5, widthPx: 170, heightPx: 128, rotationDeg: 2.0,  src: '/hqdefault.jpg', alt: 'An anime screenshot', caption: 'za warudo' },
  { id: 'photo-35', leftPct: 14.3, topPct: 39.3, widthPx: 135, heightPx: 170, rotationDeg: -2.5, src: '/images.jpeg', alt: 'An anime screenshot with a golden-ratio overlay', caption: 'the persona ratio' },
  { id: 'photo-36', leftPct: 0.9,  topPct: 12.8, widthPx: 170, heightPx: 96,  rotationDeg: 3.2,  src: '/maxresdefault.jpg', alt: 'A video game screenshot', caption: 'yakuza' },

  // ---- Dark zone: sparse — 4 personal photos (moved out of the light
  // zone above), not the 4 downloaded/meme images that used to live down
  // here on their own. Two changes bundled into one swap: the memes were
  // clustered together as their own group before, so this scatters them
  // into the light zone above instead (mixed in with everything else,
  // not their own block); and since something had to fill the space they
  // left, 4 photos moved down here rather than leaving it empty. The 4
  // that moved are the pencil/watercolor sketches and the one notebook
  // doodle shot — thematically closer to "individual pieces of art" than
  // the candid photos, which felt like a reasonable set to stand alone
  // and sparse rather than an arbitrary pick. ----
  { id: 'photo-11', leftPct: 53.8, topPct: 87.4, widthPx: 170, heightPx: 114, rotationDeg: -2.0, src: '/IMG_20231022_140633.jpg', alt: 'A personal photo', caption: 'the honest fourier transform' },
  { id: 'photo-13', leftPct: 8.8,  topPct: 80.1, widthPx: 170, heightPx: 104, rotationDeg: 4.8,  src: '/IMG_20240528_224218.jpg', alt: 'A personal photo', caption: 'naruto phase' },
  { id: 'photo-14', leftPct: 63.7, topPct: 74.3, widthPx: 170, heightPx: 97,  rotationDeg: -4.0, src: '/IMG_20240528_225351.jpg', alt: 'A personal photo', caption: 'artsy phase' },
  { id: 'photo-15', leftPct: 5.5,  topPct: 72.6, widthPx: 170, heightPx: 128, rotationDeg: 2.7,  src: '/IMG_20240528_225753.jpg', alt: 'A personal photo', caption: 'campaign poster made by me' },
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
