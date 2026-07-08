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
const TITLEBAR_KEEP_VISIBLE = 100 // px of titlebar that must stay on screen

type Rect = { x: number; y: number; w: number; h: number }
type Inset = { top: number; right: number; bottom: number; left: number }

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
  defaultInset: Inset
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
    onRectChange({
      ...s.r,
      x: Math.min(Math.max(nx, TITLEBAR_KEEP_VISIBLE - s.r.w), window.innerWidth - TITLEBAR_KEEP_VISIBLE),
      y: Math.min(Math.max(ny, 0), window.innerHeight - TASKBAR_H - 30),
    })
  }

  const onTitlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // ---- Resize (bottom-right grip) ----------------------------------------------
  const resizeStart = useRef<{ px: number; py: number; r: Rect } | null>(null)

  const onGripPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDragResize) return
    e.stopPropagation()
    resizeStart.current = { px: e.clientX, py: e.clientY, r: currentRect() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onGripPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = resizeStart.current
    if (!s) return
    onRectChange({
      ...s.r,
      w: Math.min(Math.max(s.r.w + (e.clientX - s.px), MIN_W), window.innerWidth - s.r.x - 4),
      h: Math.min(Math.max(s.r.h + (e.clientY - s.py), MIN_H), window.innerHeight - TASKBAR_H - s.r.y),
    })
  }

  const onGripPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    resizeStart.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const frameStyle: React.CSSProperties = maximized
    ? { left: 0, top: 0, right: 0, bottom: TASKBAR_H }
    : rect && interactive
      ? { left: rect.x, top: rect.y, width: rect.w, height: rect.h }
      : {
          top: defaultInset.top,
          right: defaultInset.right,
          bottom: defaultInset.bottom,
          left: defaultInset.left,
        }

  return (
    <div
      ref={rootRef}
      className="win98-app-window fixed flex flex-col"
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

      {/* Bottom-right resize grip (win98 diagonal ridges) */}
      {canDragResize && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4"
          style={{ cursor: 'nwse-resize', touchAction: 'none' }}
          onPointerDown={onGripPointerDown}
          onPointerMove={onGripPointerMove}
          onPointerUp={onGripPointerUp}
          aria-hidden="true"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" shapeRendering="crispEdges">
            <path d="M15 5 L5 15 M15 9 L9 15 M15 13 L13 15" stroke="#808080" strokeWidth="1" fill="none" />
            <path d="M15 6 L6 15 M15 10 L10 15 M15 14 L14 15" stroke="#ffffff" strokeWidth="1" fill="none" />
          </svg>
        </div>
      )}
    </div>
  )
}
