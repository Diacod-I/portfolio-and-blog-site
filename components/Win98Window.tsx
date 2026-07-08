'use client'

// Reusable win98 app window: drag by the titlebar, resize by the corner grip.
// Until the user drags/resizes, the window keeps its default inset frame
// (responsive); after first interaction it becomes an explicit rect.
// On small screens (<640px) drag/resize are disabled and the inset frame is kept.
// Window control icons are inline SVG so they render identically on every
// browser/device (text glyphs like "×" and "_" vary wildly across fonts).

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'

const TASKBAR_H = 43
const MIN_W = 360
const MIN_H = 240

type Rect = { x: number; y: number; w: number; h: number }
type Inset = { top: number; right: number; bottom: number; left: number }
// Which edges a resize handle moves — 'n'/'s' vertical, 'e'/'w' horizontal,
// corners combine one of each.
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

type Win98WindowProps = {
  title: string
  icon: string
  zIndex: number
  minimized: boolean
  /** True when this is the topmost/active window — drives the active vs
   *  inactive titlebar color, same as real Windows. */
  isFocused: boolean
  /** True when the window fills the screen (up to the taskbar). Disables
   *  drag/resize, same as a real maximized window. */
  maximized: boolean
  /** Mobile-only (<640px) fallback frame: full-bleed inset from the screen
   *  edges. Desktop uses defaultSize instead — see below. */
  defaultInset: Inset
  /** Desktop default size before the user has dragged/resized: a modest
   *  centered "card", like a real app opening — not a near-fullscreen pane.
   *  Clamped to the viewport so it never overflows on smaller windows. */
  defaultSize: { w: number; h: number }
  /** Small pixel nudge off dead-center, so multiple freshly-opened windows
   *  cascade a little instead of stacking exactly on top of each other. */
  cardOffset?: { x: number; y: number }
  /** Controlled rect: null = default inset frame (responsive); Rect = user-placed.
   *  Lives in a zustand store (see lib/store/windowStore.ts) so it survives
   *  this component unmounting when the user navigates away and back. */
  rect: Rect | null
  onRectChange: (rect: Rect) => void
  onFocus: () => void
  onMinimize: () => void
  onToggleMaximize: () => void
  onClose: () => void
  children: React.ReactNode
}

// ---- Pixel-perfect win98 control glyphs (inline SVG) ------------------------
export function MinimizeGlyph() {
  return (
    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="7" width="6" height="2" fill="currentColor" />
    </svg>
  )
}

export function CloseGlyph() {
  return (
    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" aria-hidden="true" shapeRendering="crispEdges">
      <path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" fill="none" />
    </svg>
  )
}

// Full square with a mini titlebar stripe — the classic win98 "maximize" glyph.
export function MaximizeGlyph() {
  return (
    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 3 H9" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

// Two overlapping squares — the classic win98 "restore" glyph.
export function RestoreGlyph() {
  return (
    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="3" y="1" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 2.6 H9" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="3" width="6" height="6" fill="#c5c5c5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 4.6 H7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export default function Win98Window({
  title,
  icon,
  zIndex,
  minimized,
  isFocused,
  maximized,
  defaultInset,
  defaultSize,
  cardOffset = { x: 0, y: 0 },
  rect,
  onRectChange,
  onFocus,
  onMinimize,
  onToggleMaximize,
  onClose,
  children,
}: Win98WindowProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsSmallScreen(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const interactive = !isSmallScreen
  // Dragging/resizing is disabled while maximized — same as real Windows,
  // where you drag a maximized titlebar to restore it first.
  const canDragResize = interactive && !maximized

  // Safety net beyond the live drag/resize clamps below: a rect persisted
  // from a previous session (see lib/store/windowStore.ts), or one that was
  // fine before the browser window itself got resized, could still be
  // sitting partly behind the taskbar or off-screen. Pull it back into the
  // work area on mount and whenever the viewport resizes.
  useEffect(() => {
    if (maximized || !rect) return
    const clampToBounds = () => {
      const maxX = Math.max(0, window.innerWidth - rect.w)
      const maxY = Math.max(0, window.innerHeight - TASKBAR_H - rect.h)
      const x = Math.min(Math.max(rect.x, 0), maxX)
      const y = Math.min(Math.max(rect.y, 0), maxY)
      if (x !== rect.x || y !== rect.y) onRectChange({ ...rect, x, y })
    }
    clampToBounds()
    window.addEventListener('resize', clampToBounds)
    return () => window.removeEventListener('resize', clampToBounds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect, maximized])

  /** Current rect: state if set, otherwise measured from the DOM */
  const currentRect = (): Rect => {
    if (rect) return rect
    const r = rootRef.current?.getBoundingClientRect()
    return r
      ? { x: r.left, y: r.top, w: r.width, h: r.height }
      : { x: defaultInset.left, y: defaultInset.top, w: MIN_W, h: MIN_H }
  }

  // ---- Drag (titlebar) --------------------------------------------------------
  const dragStart = useRef<{ px: number; py: number; r: Rect } | null>(null)

  const onTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragResize) return
    if ((e.target as HTMLElement).closest('button')) return // window controls
    dragStart.current = { px: e.clientX, py: e.clientY, r: currentRect() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onTitlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragStart.current
    if (!s) return
    const nx = s.r.x + (e.clientX - s.px)
    const ny = s.r.y + (e.clientY - s.py)
    // Fully contained within the desktop work area (viewport minus the
    // taskbar) — not just a visible titlebar sliver. Otherwise a tall/wide
    // window could be dragged mostly behind the taskbar or off-screen,
    // which reads as the window "disappearing".
    onRectChange({
      ...s.r,
      x: Math.min(Math.max(nx, 0), Math.max(0, window.innerWidth - s.r.w)),
      y: Math.min(Math.max(ny, 0), Math.max(0, window.innerHeight - TASKBAR_H - s.r.h)),
    })
  }

  const onTitlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // ---- Resize (all 4 edges + 4 corners, like a real OS window) ----------------
  // Each handle just tags which edges it moves ('n'/'s' vertical, 'e'/'w'
  // horizontal, corners combine one of each). computeResize below is the only
  // place that knows how a given edge combination maps pointer delta -> rect.
  const resizeStart = useRef<{ px: number; py: number; r: Rect; dir: ResizeDir } | null>(null)

  const computeResize = (dir: ResizeDir, r: Rect, dx: number, dy: number): Rect => {
    let { x, y, w, h } = r
    const maxW = window.innerWidth
    const maxH = window.innerHeight - TASKBAR_H

    // East/south edges grow away from their fixed opposite edge — same math
    // as the original bottom-right-only grip.
    if (dir.includes('e')) {
      w = Math.min(Math.max(r.w + dx, MIN_W), maxW - r.x - 4)
    }
    if (dir.includes('s')) {
      h = Math.min(Math.max(r.h + dy, MIN_H), maxH - r.y)
    }
    // West/north edges move the origin too, keeping the opposite (right/
    // bottom) edge fixed in place — like dragging a real window's left or
    // top border.
    if (dir.includes('w')) {
      let newW = Math.max(r.w - dx, MIN_W)
      let newX = r.x + r.w - newW
      if (newX < 0) {
        newX = 0
        newW = r.x + r.w
      }
      x = newX
      w = newW
    }
    if (dir.includes('n')) {
      let newH = Math.max(r.h - dy, MIN_H)
      let newY = r.y + r.h - newH
      if (newY < 0) {
        newY = 0
        newH = r.y + r.h
      }
      y = newY
      h = newH
    }
    return { x, y, w, h }
  }

  const onResizePointerDown = (dir: ResizeDir) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragResize) return
    e.stopPropagation()
    resizeStart.current = { px: e.clientX, py: e.clientY, r: currentRect(), dir }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = resizeStart.current
    if (!s) return
    onRectChange(computeResize(s.dir, s.r, e.clientX - s.px, e.clientY - s.py))
  }

  const onResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    resizeStart.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const frameStyle: React.CSSProperties = maximized
    ? { left: 0, top: 0, right: 0, bottom: TASKBAR_H }
    : rect && interactive
      ? { left: rect.x, top: rect.y, width: rect.w, height: rect.h }
      : isSmallScreen
        // Mobile, never interacted with yet: full-bleed inset frame — a small
        // centered card would leave awkward gaps on a phone screen.
        ? {
            top: defaultInset.top,
            right: defaultInset.right,
            bottom: defaultInset.bottom,
            left: defaultInset.left,
          }
        // Desktop, never interacted with yet: a modest centered card, like a
        // real app opening — not a near-fullscreen pane. currentRect() picks
        // up wherever this actually lands on screen the moment the user
        // starts dragging/resizing it.
        : {
            top: `calc(50% + ${cardOffset.y}px)`,
            left: `calc(50% + ${cardOffset.x}px)`,
            transform: 'translate(-50%, -50%)',
            width: defaultSize.w,
            height: defaultSize.h,
            maxWidth: '92vw',
            maxHeight: `calc(100vh - ${TASKBAR_H + 24}px)`,
          }

  return (
    <div
      ref={rootRef}
      // overflow-hidden as a safety net: if a window's content ever demands
      // more height/width than its current rect (e.g. a child with too tall
      // a min-height), it gets clipped to the frame instead of visually
      // spilling out past the window's own border.
      className="win98-app-window fixed flex flex-col overflow-hidden"
      style={{
        ...frameStyle,
        zIndex,
        visibility: minimized ? 'hidden' : 'visible',
      }}
      onPointerDown={onFocus}
    >
      <div
        className={`win98-titlebar select-none ${isFocused ? '' : 'win98-titlebar-inactive'}`}
        style={{ touchAction: 'none', cursor: canDragResize ? 'move' : 'default' }}
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          if (interactive) onToggleMaximize()
        }}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Image src={icon} alt="" width={16} height={16} className="w-4 h-4" draggable={false} />
          <span>{title}</span>
        </div>
        <div className="flex gap-2">
          <button
            className="win98-window-button flex items-center justify-center"
            onClick={onMinimize}
            aria-label="Minimize"
          >
            <MinimizeGlyph />
          </button>
          {interactive && (
            <button
              className="win98-window-button flex items-center justify-center"
              onClick={onToggleMaximize}
              aria-label={maximized ? 'Restore' : 'Maximize'}
            >
              {maximized ? <RestoreGlyph /> : <MaximizeGlyph />}
            </button>
          )}
          <button
            className="win98-window-button flex items-center justify-center"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseGlyph />
          </button>
        </div>
      </div>

      {children}

      {/* Resize handles: 4 edges + 4 corners, like a real OS window. Edge
          strips are thin bands along each side; corner squares sit on top
          of them (later in the DOM = higher paint priority) so diagonal
          drags near a corner grab the corner, not an edge. Bottom-right
          keeps the classic win98 diagonal-ridge grip glyph. */}
      {canDragResize && (
        <>
          <div
            className="absolute top-0 left-2.5 right-2.5 h-1.5"
            style={{ cursor: 'ns-resize', touchAction: 'none' }}
            onPointerDown={onResizePointerDown('n')}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-2.5 right-2.5 h-1.5"
            style={{ cursor: 'ns-resize', touchAction: 'none' }}
            onPointerDown={onResizePointerDown('s')}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="absolute left-0 top-2.5 bottom-2.5 w-1.5"
            style={{ cursor: 'ew-resize', touchAction: 'none' }}
            onPointerDown={onResizePointerDown('w')}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-2.5 bottom-2.5 w-1.5"
            style={{ cursor: 'ew-resize', touchAction: 'none' }}
            onPointerDown={onResizePointerDown('e')}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="absolute top-0 left-0 w-2.5 h-2.5"
            style={{ cursor: 'nwse-resize', touchAction: 'none' }}
            onPointerDown={onResizePointerDown('nw')}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="absolute top-0 right-0 w-2.5 h-2.5"
            style={{ cursor: 'nesw-resize', touchAction: 'none' }}
            onPointerDown={onResizePointerDown('ne')}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-2.5 h-2.5"
            style={{ cursor: 'nesw-resize', touchAction: 'none' }}
            onPointerDown={onResizePointerDown('sw')}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4"
            style={{ cursor: 'nwse-resize', touchAction: 'none' }}
            onPointerDown={onResizePointerDown('se')}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-hidden="true"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" shapeRendering="crispEdges">
              <path d="M15 5 L5 15 M15 9 L9 15 M15 13 L13 15" stroke="#808080" strokeWidth="1" fill="none" />
              <path d="M15 6 L6 15 M15 10 L10 15 M15 14 L14 15" stroke="#ffffff" strokeWidth="1" fill="none" />
            </svg>
          </div>
        </>
      )}
    </div>
  )
}
