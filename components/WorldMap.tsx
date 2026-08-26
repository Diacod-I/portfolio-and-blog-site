'use client'

// Interactive world map for advith.exe's Home tab, sitting right after the
// Experience section in the dossier column (see HomeClient.tsx) — real
// per-country boundaries (see data/worldMap.ts for provenance) rendered as
// thin outline-only paths against the dark background, with India filled
// solid in the same blue GithubContributionGraph.tsx's heatmap uses.
//
// Pan/zoom is hand-rolled (drag-to-pan via Pointer Events, scroll-to-zoom
// anchored on the cursor, plus +/- /reset buttons) rather than pulled in
// from a mapping library like react-simple-maps: this sandbox's shell has
// no npm registry access (`npm view react-simple-maps` 403s), so a new
// dependency here would go untested — tsc would have nothing to type-check
// against locally, and Vercel's build is the first place it would ever
// actually resolve. Real country geometry + a small transform-on-a-<g>
// implementation gets the same drag/scroll/zoom feel as the reference
// (karanpargal.vercel.app) the user pointed at, without that risk.
import { useCallback, useRef, useState } from 'react'
import { WORLD_PATHS, INDIA_FILL, INDIA_PATH, WORLD_MAP_VIEWBOX } from '@/data/worldMap'

const VB_W = 1000
const VB_H = 500
const MIN_SCALE = 1
const MAX_SCALE = 8
const WHEEL_ZOOM_FACTOR = 1.15
const BUTTON_ZOOM_FACTOR = 1.35

type MapTransform = { x: number; y: number; k: number }

const IDENTITY_TRANSFORM: MapTransform = { x: 0, y: 0, k: 1 }

// Keeps the map from being dragged/zoomed completely off-panel — generous
// enough that panning still feels free, not a hard "snap back" boundary.
function clampTransform(t: MapTransform): MapTransform {
  const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.k))
  const slackX = VB_W * (k - 1) + VB_W * 0.4
  const slackY = VB_H * (k - 1) + VB_H * 0.4
  return {
    k,
    x: Math.min(slackX, Math.max(-slackX, t.x)),
    y: Math.min(slackY, Math.max(-slackY, t.y)),
  }
}

export default function WorldMap() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [transform, setTransform] = useState<MapTransform>(IDENTITY_TRANSFORM)
  // Pointer-drag state lives in a ref, not React state — it changes on every
  // pointermove and doesn't need to trigger its own re-render (setTransform
  // already does that).
  const dragRef = useRef<{ startClientX: number; startClientY: number; startX: number; startY: number } | null>(null)

  // Ratio between CSS pixels the SVG is actually rendered at and its
  // viewBox's user units — needed because the SVG is responsive
  // (`w-full h-auto`), so a screen-pixel drag delta isn't a 1:1 viewBox
  // delta once the panel is narrower or wider than 1000px.
  const pxToSvgRatio = useCallback(() => {
    const svg = svgRef.current
    const width = svg?.getBoundingClientRect().width
    return width ? VB_W / width : 1
  }, [])

  const zoomAtClientPoint = useCallback((clientX: number, clientY: number, factor: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const ratio = pxToSvgRatio()
    setTransform((t) => {
      // Point under the cursor, in pre-transform "world" (viewBox) space —
      // solving k'*world + x' = k*world + x for x' keeps that exact point
      // fixed under the cursor as k changes, which is what makes
      // scroll-to-zoom feel anchored instead of re-centering on every tick.
      const screenX = (clientX - rect.left) * ratio
      const screenY = (clientY - rect.top) * ratio
      const worldX = (screenX - t.x) / t.k
      const worldY = (screenY - t.y) / t.k
      const nextK = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.k * factor))
      return clampTransform({
        k: nextK,
        x: screenX - worldX * nextK,
        y: screenY - worldY * nextK,
      })
    })
  }, [pxToSvgRatio])

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startClientX: e.clientX, startClientY: e.clientY, startX: transform.x, startY: transform.y }
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const ratio = pxToSvgRatio()
    const dx = (e.clientX - drag.startClientX) * ratio
    const dy = (e.clientY - drag.startClientY) * ratio
    setTransform((t) => clampTransform({ ...t, x: drag.startX + dx, y: drag.startY + dy }))
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    zoomAtClientPoint(e.clientX, e.clientY, e.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR)
  }

  const zoomFromButton = (factor: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    zoomAtClientPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, factor)
  }

  const resetView = () => setTransform(IDENTITY_TRANSFORM)

  // Hairline strokes get visually thicker as the map zooms in (since the
  // whole <g> — paths included — is being scaled up); dividing by k keeps
  // the stroke width constant on screen instead of ballooning at max zoom.
  const strokeWidth = 1.2 / transform.k

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
        <svg
          ref={svgRef}
          viewBox={WORLD_MAP_VIEWBOX}
          // Not aria-hidden — decorative, but the actual information ("based
          // in India") is redundant with this label, so it's fine as a
          // straightforward img role rather than needing to be hidden.
          role="img"
          aria-label="An interactive world map with India highlighted; drag to pan, scroll to zoom"
          className="w-full h-auto cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
            {WORLD_PATHS.map((c) => (
              <path key={c.id} d={c.d} fill="none" stroke="#6b7280" strokeWidth={strokeWidth} strokeLinejoin="round" />
            ))}
            <path d={INDIA_PATH} fill={INDIA_FILL} stroke={INDIA_FILL} strokeWidth={strokeWidth} strokeLinejoin="round" />
          </g>
        </svg>
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <button type="button" onClick={() => zoomFromButton(BUTTON_ZOOM_FACTOR)} className="win98-window-button" aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={() => zoomFromButton(1 / BUTTON_ZOOM_FACTOR)} className="win98-window-button" aria-label="Zoom out">
            −
          </button>
          <button type="button" onClick={resetView} className="win98-window-button" aria-label="Reset view">
            <span className="text-xs">▢</span>
          </button>
        </div>
      </div>
    </div>
  )
}
