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
import { ComposableMap, Geographies, Geography, Graticule, Marker, Sphere } from 'react-simple-maps'
import { INDIA_FILL } from '@/data/worldMap'

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
          <span>Location</span>
        </div>
      </div>
      <div className="bg-[#1f1f1f] border-2 p-2 relative">
        <ComposableMap
          width={960}
          height={500}
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 155 }}
          role="img"
          aria-label="A world map with India filled in and labeled"
          style={{ width: '100%', height: 'auto' }}
        >
          <Sphere id="rsm-sphere" fill={GLOBE_FILL} stroke={GLOBE_FILL} strokeWidth={0.5} />
          <Graticule stroke="#2a2a2a" strokeWidth={0.5} />
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isIndia = geo.properties?.name === 'India'
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isIndia ? INDIA_FILL : 'transparent'}
                    stroke={isIndia ? INDIA_FILL : '#6b7280'}
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
          {/* Label callout for India: a small box floating above the
              country with a leader line down to its centroid, so it reads
              as "this filled shape is India" rather than relying on the
              fill color alone. */}
          <Marker coordinates={INDIA_CENTROID}>
            <line x1={0} y1={-26} x2={0} y2={-2} stroke={INDIA_FILL} strokeWidth={1} />
            <circle r={2} fill={INDIA_FILL} />
            <g transform="translate(0, -26)">
              <rect x={-20} y={-16} width={40} height={16} fill="#1f1f1f" stroke={INDIA_FILL} strokeWidth={1} />
              <text
                textAnchor="middle"
                y={-5}
                fontSize={8}
                fontWeight={700}
                letterSpacing={0.5}
                fill={INDIA_FILL}
                style={{ fontFamily: 'monospace' }}
              >
                INDIA
              </text>
            </g>
          </Marker>
        </ComposableMap>
      </div>
    </div>
  )
}
