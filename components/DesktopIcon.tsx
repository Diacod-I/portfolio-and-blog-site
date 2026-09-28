'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

export type GridCell = { col: number; row: number }

export const GRID = {
  originX: 16, // desktop padding
  originY: 16,
  cellW: 112,
  cellH: 108,
}

export function cellToPx(cell: GridCell) {
  return {
    left: GRID.originX + cell.col * GRID.cellW,
    top: GRID.originY + cell.row * GRID.cellH,
  }
}

export function pxToNearestCell(left: number, top: number): GridCell {
  return {
    col: Math.max(0, Math.round((left - GRID.originX) / GRID.cellW)),
    row: Math.max(0, Math.round((top - GRID.originY) / GRID.cellH)),
  }
}

type DesktopIconProps = {
  id: string
  label: string
  icon: string
  cell: GridCell
  showBadge?: boolean
  /** Rubber-band-marquee / click / ctrl-click selection state — see
   *  HomeClient's selectedIds. This icon's label/tint are the only visual
   *  "this is highlighted" treatment now — an earlier isActive prop gave an
   *  open app's icon the same navy-label look permanently, which read as
   *  indistinguishable from actually being selected and wasn't wanted. */
  isSelected?: boolean
  /** Grayed-out look (win98 "unavailable"); parent still receives onOpen */
  disabled?: boolean
  /** Skips the select-first/double-click-to-open real-desktop convention
   *  entirely and opens straight on a single tap, same as this site always
   *  has — real OSes reserve double-click for desktop/mouse input, touch
   *  UIs use a single tap to open (there's no touch equivalent of
   *  "double-click" most visitors would know to try), so HomeClient passes
   *  this true on its own isMobile check rather than this component trying
   *  to detect touch itself. Multi-select/marquee still isn't meaningful on
   *  a phone either way — this is the one place that distinction matters. */
  openOnSingleClick?: boolean
  /** Passed straight to next/image — set true only for whichever icon is
   *  actually the page's LCP element (see HomeClient), not every icon, or
   *  it stops meaning anything. */
  priority?: boolean
  /** Live pixel offset applied on top of this icon's normal grid position
   *  while it's riding along in a *different* icon's group-drag (see
   *  HomeClient's groupDragOffset) — this icon's own drag isn't the one in
   *  progress, so it has no dragPos of its own, just this borrowed delta. */
  groupDragOffset?: { dx: number; dy: number } | null
  /** z-index to use while this icon is actively being dragged (either as
   *  the anchor via its own dragPos, or as a group-drag passenger via
   *  groupDragOffset above) — see HomeClient's own comment on
   *  draggingIconZIndex for why this has to be computed fresh from the
   *  currently-open windows' own z-indices rather than a fixed number:
   *  window z-index only ever grows (persisted, never reset), so no
   *  hardcoded constant stays correct for the life of a visitor's session. */
  draggingZIndex?: number
  onOpen: () => void
  onMove: (id: string, cell: GridCell) => void
  /** Single click (no drag): real OS semantics — click selects, it doesn't
   *  open (see onOpen/double-click below). `additive` is true when
   *  shift/ctrl/cmd was held, telling the parent to toggle this icon into
   *  the existing selection instead of replacing it. */
  onSelect: (id: string, additive: boolean) => void
  /** Fired on every pointermove past the drag threshold, with the raw pixel
   *  delta from drag start — lets the parent visually drag every *other*
   *  selected icon along with this one in real time when this icon is part
   *  of a multi-selection (see groupDragOffset above). `null` marks drag
   *  end (pointerup/cancel), telling the parent to clear the live offset. */
  onDragMove?: (id: string, delta: { dx: number; dy: number } | null) => void
  onContextMenuAt?: (id: string, x: number, y: number) => void
}

const DRAG_THRESHOLD = 6
// Real OS double-click timing — long enough for a deliberate two-click
// open, short enough that two unrelated clicks (e.g. select this icon, then
// come back and select it again 2 seconds later) don't accidentally open
// it.
const DOUBLE_CLICK_MS = 400

export default function DesktopIcon({
  id,
  label,
  icon,
  cell,
  showBadge = false,
  isSelected = false,
  disabled = false,
  priority = false,
  openOnSingleClick = false,
  groupDragOffset = null,
  draggingZIndex = 50,
  onOpen,
  onMove,
  onSelect,
  onDragMove,
  onContextMenuAt,
}: DesktopIconProps) {
  const [dragPos, setDragPos] = useState<{ left: number; top: number } | null>(null)
  const dragState = useRef<{
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    moved: boolean
  } | null>(null)
  // Real double-click detection: a timestamp, not a boolean — a synthetic
  // "click count" isn't reliable across pointer-capture-driven drags, so
  // this just checks "was the last completed click on this icon recent
  // enough" by hand, same idea browsers use internally for dblclick.
  const lastClickAtRef = useRef(0)

  const base = cellToPx(cell)
  const pos = dragPos ?? (groupDragOffset ? { left: base.left + groupDragOffset.dx, top: base.top + groupDragOffset.dy } : base)

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Left button / touch only
    if (e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      moved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = dragState.current
    if (!s) return
    if (
      !s.moved &&
      Math.hypot(e.clientX - s.startX, e.clientY - s.startY) < DRAG_THRESHOLD
    ) {
      return
    }
    s.moved = true
    setDragPos({ left: e.clientX - s.offsetX, top: e.clientY - s.offsetY })
    onDragMove?.(id, { dx: e.clientX - s.startX, dy: e.clientY - s.startY })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = dragState.current
    dragState.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)

    if (!s) return
    if (!s.moved) {
      setDragPos(null)
      if (openOnSingleClick) {
        onOpen()
        return
      }
      // Real OS semantics: a plain click selects (single, unless a
      // modifier is held) — it takes a second click within
      // DOUBLE_CLICK_MS, close enough together to not have moved, to
      // actually open the app.
      const now = e.timeStamp
      const additive = e.shiftKey || e.ctrlKey || e.metaKey
      if (!additive && now - lastClickAtRef.current < DOUBLE_CLICK_MS) {
        lastClickAtRef.current = 0
        onOpen()
      } else {
        lastClickAtRef.current = now
        onSelect(id, additive)
      }
      return
    }
    // Snap to nearest grid cell, clamped to the viewport
    const dropLeft = Math.min(
      Math.max(GRID.originX, e.clientX - s.offsetX),
      window.innerWidth - GRID.cellW
    )
    const dropTop = Math.min(
      Math.max(GRID.originY, e.clientY - s.offsetY),
      window.innerHeight - GRID.cellH - 60 // keep clear of the taskbar
    )
    setDragPos(null)
    onDragMove?.(id, null)
    onMove(id, pxToNearestCell(dropLeft, dropTop))
  }

  // Shared cleanup for both pointercancel and lostpointercapture — the
  // latter fires whenever capture is released for *any* reason, including
  // ones neither pointerup nor pointercancel necessarily cover (the tab
  // losing focus mid-drag, the browser reclaiming capture on its own,
  // etc.). Without this as a backstop, one of those edge cases could in
  // theory leave dragState/dragPos (and the parent's groupDrag, via
  // onDragMove) stuck forever with no further event left to clear them —
  // this guarantees there's always exactly one more chance to reset.
  const handleDragInterrupted = () => {
    if (!dragState.current) return
    dragState.current = null
    setDragPos(null)
    onDragMove?.(id, null)
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handleDragInterrupted}
      onLostPointerCapture={handleDragInterrupted}
      onContextMenu={(e) => {
        // Right-click always acts on this one icon (real OS: right-clicking
        // an unselected icon selects just it first) — onContextMenuAt's
        // caller in HomeClient handles that "select if not already
        // selected" step, this just reports where/which.
        e.preventDefault()
        onContextMenuAt?.(id, e.clientX, e.clientY)
      }}
      className="absolute w-28 flex flex-col items-center gap-1 p-2 select-none"
      style={{
        left: pos.left,
        top: pos.top,
        touchAction: 'none',
        // Elevated for both the icon actually being dragged (dragPos) and
        // any other selected icon riding along with it (groupDragOffset) —
        // see draggingZIndex's own comment above for why this can't be a
        // fixed number. Resting z-index (10) deliberately stays below every
        // open window (40+) — icons live behind windows at rest, same as a
        // real desktop; it's only the drag feedback itself that needs to
        // win against whatever's currently open.
        zIndex: (dragPos || groupDragOffset) ? draggingZIndex : 10,
        opacity: dragPos ? 0.75 : disabled ? 0.55 : 1,
        cursor: dragPos ? 'grabbing' : 'pointer',
        // Grayed-out win98 "unavailable" look. The icon stays draggable and
        // tappable — the parent decides what onOpen does (e.g. show a
        // desktop-only tooltip instead of opening the app).
        filter: disabled ? 'grayscale(1)' : undefined,
      }}
      aria-label={`${label}, ${isSelected ? 'selected' : 'not selected'} — double-click to open`}
      aria-disabled={disabled}
      aria-selected={isSelected}
    >
      <div className="relative pointer-events-none w-14 h-14">
        {/* fill + object-contain instead of a fixed width/height: some icons
            (e.g. Doom's logo) aren't square like the rest, and a fixed
            width/height on next/image stretches a non-square source to
            fit exactly — this letterboxes it within the same 56x56 slot
            instead of distorting it. */}
        <Image
          src={icon}
          alt=""
          fill
          sizes="56px"
          className="object-contain"
          draggable={false}
          priority={priority}
        />
        {isSelected && <div className="win98-icon-tint" aria-hidden="true" />}
        {showBadge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse-expand"></span>
        )}
      </div>
      {/* No max-width on the label: a single unbreakable word wider than the
          icon cell ("Minesweeper") must grow the span so the teal background
          covers all of it — clamping painted the text past the background.
          Multi-word labels still wrap at spaces (flex column limits width
          for wrappable content), and the label stays centered either way. */}
      <span
        className={`win98-app-name text-center pointer-events-none ${isSelected ? 'selected' : ''}`}
      >
        {label}
      </span>
    </button>
  )
}
