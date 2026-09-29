'use client'

// Static world map for advith.exe's Home tab, sitting right after the
// Experience section in the dossier column (see HomeClient.tsx).
//
// Rendered with react-simple-maps (d3-geo under the hood) rather than
// hand-rolled SVG paths — that was the previous approach here and it read
// as broken (bad projection math, done by hand instead of by a real
// geometry engine). This is the "component that's already done the work":
// react-simple-maps handles the projection and path generation; this file
// just wires it up, fills in India, and drops a label callout over it.
// Explicitly non-interactive per feedback — no ZoomableGroup, no pan/zoom
// buttons, just a fixed view of the whole globe.
//
// width/height are set to 960x500, not left at react-simple-maps' own
// defaults (800x600) — 960x500 is the aspect ratio geoNaturalEarth1's
// default d3-geo scale is calibrated against (it's the pairing virtually
// every d3/react-simple-maps example using this projection uses), so the
// sphere sits fully inside the viewBox instead of being cropped at the
// poles or sides. projectionConfig.scale is set a bit under that default
// on top of that as extra margin, so the full outline — every edge of
// every landmass — stays inside the frame with room to spare rather than
// riding right up against it.
//
// Country geometry: this used to be a GeoJSON file I hand-assembled by
// fetching ~66 countries one at a time and merging them myself (see git
// history for data/countries.geo.json, now removed). That still looked
// broken after switching to react-simple-maps, and reading the library's
// own source explains why — react-simple-maps only runs antimeridian-safe,
// consistently-wound geometry reconstruction (via topojson-client) when it's
// handed real TopoJSON; a plain merged GeoJSON FeatureCollection like mine
// gets used as-is, so any winding-order or antimeridian-crossing quirks in
// the source data (very easy to introduce by hand for wide-spanning
// countries like Russia, Canada, the US) render as visibly broken shapes.
// So instead of assembling geometry myself, this now points at world-atlas's
// countries-110m.json — the pre-built, properly-wound TopoJSON dataset most
// react-simple-maps examples are built around. Passed as a URL string,
// react-simple-maps fetches and parses it itself at runtime in the browser
// (see fetchGeographies in the library source), so there's no local JSON
// payload to bundle at all.
//
// Deliberately 110m, not the more detailed 50m: 50m resolution reveals
// small outlying territories 110m simply omits (too small to render at
// all at that resolution) — India's Andaman & Nicobar and Lakshadweep
// islands, for instance, show up as scattered stray-colored specks far
// from the mainland, reading as visual noise rather than "more accurate."
// 110m keeps each country's shape as one clean landmass. The tradeoff is
// that a handful of very small countries (Singapore) have no polygon at
// all in 110m data — see REMOTE_COUNTRIES' dotRadius in data/worldMap.ts
// for how that's handled without switching datasets.
import { ComposableMap, Geographies, Geography, Graticule, Marker, Sphere } from 'react-simple-maps'
import { INDIA_FILL, REMOTE_FILL, REMOTE_COUNTRIES } from '@/data/worldMap'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Geographic centroid of India (roughly Jhansi, UP), used to place the
// label callout — Marker projects these [lon, lat] coordinates through the
// same d3 projection the countries are drawn with, so the box lines up with
// the filled country regardless of the projection/viewBox math above.
const INDIA_CENTROID: [number, number] = [78.9629, 22.5937]

// A little darker than the win98-window panel behind it (#1f1f1f), and the
// sphere's own outline is set to this same color rather than a lighter
// contrasting ring — the globe should read as one dark shape, not a filled
// circle with a bright edge.
const GLOBE_FILL = '#161616'

type MapLabel = {
  id: string
  label: string
  centroid: [number, number]
  fill: string
  labelDy?: number
  dotRadius?: number
}

// India plus every REMOTE_COUNTRIES entry, in one shared shape so they can
// be sorted and rendered by a single loop (see its own comment below on
// why the sort — and therefore this merge — exists at all).
const ALL_LABELS: MapLabel[] = [
  { id: 'india', label: 'INDIA', centroid: INDIA_CENTROID, fill: INDIA_FILL },
  ...REMOTE_COUNTRIES.map((c) => ({ ...c, fill: REMOTE_FILL })),
]

export default function WorldMap() {
  return (
    // Same nested win98-window pattern ExperienceSection.tsx and
    // ContactView's Internet Shortcuts card use — titlebar + a dark content
    // panel — rather than a bare bordered box, so this reads as another
    // self-contained block in the same dossier column instead of a
    // one-off styling choice.
    <div className="win98-window flex flex-col mt-3">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <span>Work map</span>
        </div>
      </div>
      <div className="bg-[#1f1f1f] border-2 p-2 relative">
        <ComposableMap
          width={960}
          height={500}
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 155 }}
          role="img"
          aria-label="A world map with India marked as home base, and the USA, Switzerland, Singapore, and UK filled in as countries worked with remotely while based in India"
          style={{ width: '100%', height: 'auto' }}
        >
          <Sphere id="rsm-sphere" fill={GLOBE_FILL} stroke={GLOBE_FILL} strokeWidth={0.5} />
          <Graticule stroke="#2a2a2a" strokeWidth={0.5} />
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isIndia = geo.properties?.name === 'India'
                // Matched by name OR numeric id (see data/worldMap.ts's own
                // comment on why both) — either one hitting is enough.
                const isRemote = REMOTE_COUNTRIES.some(
                  (c) => c.name === geo.properties?.name || c.id === geo.id
                )
                const fill = isIndia ? INDIA_FILL : isRemote ? REMOTE_FILL : 'transparent'
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={isIndia ? INDIA_FILL : isRemote ? REMOTE_FILL : '#6b7280'}
                    strokeWidth={0.75}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
          {/* One shared label-callout renderer for India + every remote
              country, rather than India's own hand-written copy — needed
              so both participate in the same z-ordering pass below. SVG has
              no z-index for sibling elements; stacking is purely DOM order,
              later = on top. Two overlapping label boxes (e.g. UK and
              Switzerland, both clustered in Europe) would otherwise stack
              in whatever arbitrary order they happened to be declared in,
              which can put a "higher" (further north) label's box on top of
              a "lower" (further south) one it overlaps — backwards from how
              a real map reads, where the nearer/lower pin should win.
              ALL_LABELS sorts every label by latitude, north to south, so
              mapping over it in order naturally renders southernmost labels
              last — i.e. highest DOM position, i.e. on top — matching that
              rule for every pair, not just the one that happened to prompt
              this. */}
          {ALL_LABELS
            .slice()
            .sort((a, b) => b.centroid[1] - a.centroid[1])
            .map((item) => {
              const dy = item.labelDy ?? 26
              const dotRadius = item.dotRadius ?? 2
              // Per-char multiplier/padding scaled up alongside the 14px
              // font below (was 7/16 for a 10px font, 5.6/12 for 8px) — box
              // height grows downward from a fixed y=0 baseline at the dot,
              // so a taller box only extends further up, it never needs dy
              // adjusted to avoid colliding with the dot/line it's already
              // anchored to.
              const boxWidth = item.label.length * 10 + 22
              return (
                <Marker key={item.id} coordinates={item.centroid}>
                  <line x1={0} y1={-dy} x2={0} y2={-dotRadius} stroke={item.fill} strokeWidth={1} />
                  <circle r={dotRadius} fill={item.fill} />
                  <g transform={`translate(0, -${dy})`}>
                    {/* Box width derived from the label length rather than
                        a fixed size — labels vary from 3 chars (USA/UK) to
                        11 (SWITZERLAND). The per-char multiplier accounts
                        for this monospace font's actual glyph advance at
                        14px (~8.4px/char) and the 0.8px letterSpacing
                        between glyphs, plus generous padding so a bold
                        weight rendering slightly wider than expected still
                        doesn't clip past the box edges. */}
                    <rect
                      x={-boxWidth / 2}
                      y={-26}
                      width={boxWidth}
                      height={26}
                      fill="#1f1f1f"
                      stroke={item.fill}
                      strokeWidth={1.5}
                    />
                    <text
                      textAnchor="middle"
                      y={-9}
                      fontSize={14}
                      fontWeight={700}
                      letterSpacing={0.8}
                      fill={item.fill}
                      style={{ fontFamily: 'monospace' }}
                    >
                      {item.label}
                    </text>
                  </g>
                </Marker>
              )
            })}
        </ComposableMap>
        {/* Legend: same dark panel, monospace label treatment as the map's
            own India callout box, just laid out as a small key rather than
            pinned to the globe — a color alone (especially blue vs. green
            on a dark background) isn't reliably distinguishable for every
            visitor, so this spells out what each fill means. */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1 text-[10px] font-mono text-[#ccc]">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 border"
              style={{ backgroundColor: INDIA_FILL, borderColor: INDIA_FILL }}
            />
            <span>Current Location</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 border"
              style={{ backgroundColor: REMOTE_FILL, borderColor: REMOTE_FILL }}
            />
            <span>Worked Remotely With</span>
          </div>
        </div>
      </div>
    </div>
  )
}
