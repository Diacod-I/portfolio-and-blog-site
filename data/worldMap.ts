// data/worldMap.ts
// Backing data for components/WorldMap.tsx — a small decorative world map
// on advith.exe's Home tab, sitting right after the Experience section in
// the dossier column (see HomeClient.tsx). Continents render as outline-only
// shapes; India renders filled, in the same blue GithubContributionGraph.tsx
// uses for its most-active-day heatmap cells (LEVEL_COLORS[3], '#0ea5e9') —
// see INDIA_FILL below, kept as its own named export specifically so the two
// components can't quietly drift apart if that palette ever changes.
//
// IMPORTANT — what this data actually is: every path below is a hand-drawn,
// heavily simplified silhouette, not real GIS/survey data. The original plan
// was to use an actual public country-boundary dataset (there's a
// well-known lightweight one, github.com/johan/world.geo.json, real
// lat/lon polygons per country), and one fetch of it did succeed mid-session
// — but it came back truncated (this environment's fetch tool caps how much
// a single request can return, and a full ~200-country file is bigger than
// that cap), and every follow-up fetch after it (for India specifically, for
// a more compact topojson version, even for a plain README on the same repo)
// timed out outright — network access from this environment was
// unreliable/down for the rest of the session, not something retrying would
// have fixed. Rather than ship a patchwork of a few dozen real countries
// sitting in an otherwise-empty ocean (missing the USA, Russia, China, all
// of Western Europe, and — the one country that actually matters here —
// India itself), this is a from-scratch stylized approximation instead:
// coherent continent silhouettes plus a hand-approximated India outline
// (Kashmir's northern point, the Gujarat/Kutch bulge west, the peninsula
// narrowing to Kanyakumari at the southern tip, the northeastern hill states'
// eastward hook), good enough to read correctly as India at this scale, but
// not accurate to any real boundary survey. If real per-country boundary
// data is wanted later, swapping CONTINENT_PATHS/INDIA_PATH below for
// projected coordinates from a real dataset is a self-contained change —
// nothing else in WorldMap.tsx needs to know the difference.
//
// Projection: plain equirectangular, hand-placed rather than computed from
// real lon/lat (since the source coordinates here were never real lon/lat
// to begin with) — x runs 0-1000 for -180°..180° longitude, y runs 0-500 for
// +90°..-90° latitude, same convention a real equirectangular projection
// would use, so swapping in real projected data later drops in at the same
// scale without needing to touch the viewBox.
export const WORLD_MAP_VIEWBOX = '0 0 1000 500'

export const INDIA_FILL = '#0ea5e9'

export type ContinentPath = {
  id: string
  d: string
}

export const CONTINENT_PATHS: ContinentPath[] = [
  {
    id: 'north-america',
    d: 'M 60,70 L 100,45 L 150,42 L 200,55 L 230,90 L 260,110 L 290,100 L 310,130 L 330,160 L 325,195 L 300,210 L 290,230 L 270,250 L 250,255 L 230,240 L 210,220 L 190,210 L 170,215 L 150,200 L 130,190 L 110,175 L 90,165 L 70,150 L 55,130 L 50,100 L 60,70 Z',
  },
  {
    id: 'greenland',
    d: 'M 330,35 L 355,30 L 375,45 L 370,65 L 350,70 L 335,55 L 330,35 Z',
  },
  {
    id: 'south-america',
    d: 'M 290,222 L 320,215 L 350,225 L 380,240 L 400,255 L 405,280 L 395,300 L 385,320 L 375,340 L 365,360 L 355,380 L 340,395 L 325,405 L 310,400 L 305,380 L 300,360 L 295,340 L 285,320 L 275,300 L 270,280 L 275,260 L 280,240 L 290,222 Z',
  },
  {
    id: 'africa',
    d: 'M 460,150 L 500,145 L 540,148 L 580,150 L 610,160 L 630,180 L 655,195 L 660,215 L 645,230 L 655,250 L 640,270 L 630,290 L 615,310 L 595,325 L 580,340 L 565,345 L 550,335 L 540,315 L 525,295 L 510,275 L 495,255 L 480,235 L 470,215 L 460,195 L 455,175 L 460,150 Z',
  },
  {
    id: 'europe',
    d: 'M 470,110 L 500,95 L 530,90 L 555,100 L 580,95 L 600,105 L 605,120 L 590,135 L 570,140 L 550,150 L 530,145 L 510,150 L 490,140 L 475,125 L 470,110 Z',
  },
  {
    id: 'asia',
    d: 'M 600,105 L 640,90 L 690,70 L 750,60 L 820,55 L 880,65 L 930,80 L 970,100 L 995,120 L 1000,140 L 985,160 L 960,175 L 930,185 L 900,195 L 870,205 L 840,215 L 810,220 L 790,215 L 770,225 L 750,235 L 730,230 L 710,220 L 690,210 L 670,200 L 650,190 L 630,175 L 615,160 L 605,140 L 600,120 L 600,105 Z',
  },
  {
    id: 'australia',
    d: 'M 820,290 L 860,282 L 895,288 L 915,300 L 920,320 L 905,335 L 880,340 L 855,338 L 835,325 L 822,308 L 820,290 Z',
  },
]

// India — see the file header on why this is a simplified approximation,
// not a real boundary. Roughly, clockwise from Kashmir: the northern point,
// the Himalayan border east through Nepal/Bhutan, the northeastern hook
// (Assam/the "chicken's neck" states), down the east coast to Kanyakumari
// at the southern tip, back up the west coast through Kerala/Karnataka/Goa,
// the Gujarat coastline, out to the Kutch bulge (the westernmost point),
// then back up through Rajasthan/Punjab to Kashmir again.
export const INDIA_PATH =
  'M 705,148 L 722,143 L 738,148 L 748,145 L 758,152 L 765,162 L 762,178 L 768,188 L 760,200 L 750,212 L 735,222 L 722,228 L 710,220 L 698,210 L 688,198 L 682,185 L 672,178 L 680,168 L 690,158 L 698,150 Z'
