'use client'

// Interactive world map for advith.exe's Home tab, sitting right after the
// Experience section in the dossier column (see HomeClient.tsx).
//
// Rendered with react-simple-maps (d3-geo under the hood) rather than
// hand-rolled SVG paths — that was the previous approach here and it read
// as broken (bad projection math, done by hand instead of by a real
// geometry engine). This is the "component that's already done the work":
// react-simple-maps handles the projection, path generation, and drag/
// wheel/pinch zoom (via ZoomableGroup); this file just wires it up and
// fills in India.
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
import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Graticule, Sphere, ZoomableGroup } from 'react-simple-maps'
import { INDIA_FILL } from '@/data/worldMap'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const MIN_ZOOM = 1
const MAX_ZOOM = 8
const ZOOM_STEP = 1.5

type MapPosition = { coordinates: [number, number]; zoom: number }

const DEFAULT_POSITION: MapPosition = { coordinates: [0, 0], zoom: 1 }

export default function WorldMap() {
  // Controlled zoom/pan, following react-simple-maps' own documented
  // pattern for wiring external +/- buttons up to ZoomableGroup: keep the
  // {coordinates, zoom} pair in state, hand it to ZoomableGroup as
  // center/zoom, and let onMoveEnd (fired after a drag or wheel gesture)
  // write the user's own panning/zooming back into that same state.
  const [position, setPosition] = useState<MapPosition>(DEFAULT_POSITION)

  const handleZoomIn = () =>
    setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * ZOOM_STEP, MAX_ZOOM) }))
  const handleZoomOut = () =>
    setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / ZOOM_STEP, MIN_ZOOM) }))
  const handleReset = () => setPosition(DEFAULT_POSITION)

  return (
    // Same nested win98-window pattern ExperienceSection.tsx and
    // ContactView's Internet Shortcuts card use — titlebar + a dark content
    // panel — rather than a bare bordered box, so this reads as another
    // self-contained block in the same dossier column instead of a
    // one-off styling choice.
    <div className="win98-window flex flex-col mt-8">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <span>Location</span>
        </div>
      </div>
      <div className="bg-[#1f1f1f] border-2 p-2 relative">
        <div className="flex items-center justify-between text-[10px] text-[#888] px-1 pb-1 tracking-wide select-none">
          <span>INDIA</span>
          <span>DRAG · SCROLL · ZOOM</span>
        </div>
        <ComposableMap
          projection="geoNaturalEarth1"
          role="img"
          aria-label="An interactive world map with India highlighted; drag to pan, scroll to zoom"
          style={{ width: '100%', height: 'auto', cursor: 'grab' }}
        >
          <ZoomableGroup
            center={position.coordinates}
            zoom={position.zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onMoveEnd={(pos) => setPosition(pos as MapPosition)}
          >
            <Sphere id="rsm-sphere" fill="transparent" stroke="#3a3a3a" strokeWidth={0.5} />
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
                      strokeWidth={0.6}
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
          </ZoomableGroup>
        </ComposableMap>
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <button type="button" onClick={handleZoomIn} className="win98-window-button" aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={handleZoomOut} className="win98-window-button" aria-label="Zoom out">
            −
          </button>
          <button type="button" onClick={handleReset} className="win98-window-button" aria-label="Reset view">
            <span className="text-xs">▢</span>
          </button>
        </div>
      </div>
    </div>
  )
}
