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
  isActive?: boolean
  /** Grayed-out look (win98 "unavailable"); parent still receives onOpen */
  disabled?: boolean
  onOpen: () => void
  onMove: (id: string, cell: GridCell) => void
}

const DRAG_THRESHOLD = 6

export default function DesktopIcon({
  id,
  label,
  icon,
  cell,
  showBadge = false,
  isActive = false,
  disabled = false,
  onOpen,
  onMove,
}: DesktopIconProps) {
  const [dragPos, setDragPos] = useState<{ left: number; top: number } | null>(null)
  const dragState = useRef<{
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    moved: boolean
  } | null>(null)

  const base = cellToPx(cell)
  const pos = dragPos ?? base

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
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = dragState.current
    dragState.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)

    if (!s) return
    if (!s.moved) {
      setDragPos(null)
      onOpen()
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
    onMove(id, pxToNearestCell(dropLeft, dropTop))
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute w-28 flex flex-col items-center gap-1 p-2 select-none"
      style={{
        left: pos.left,
        top: pos.top,
        touchAction: 'none',
        zIndex: dragPos ? 50 : 10,
        opacity: dragPos ? 0.75 : disabled ? 0.55 : 1,
        cursor: dragPos ? 'grabbing' : 'pointer',
        // Grayed-out win98 "unavailable" look. The icon stays draggable and
        // tappable — the parent decides what onOpen does (e.g. show a
        // desktop-only tooltip instead of opening the app).
        filter: disabled ? 'grayscale(1)' : undefined,
      }}
      aria-label={`Open ${label}`}
      aria-disabled={disabled}
    >
      <div className="relative pointer-events-none w-14 h-14">
        {/* fill + object-contain instead of a fixed width/height: some icons
            (e.g. Doom's logo) aren't square like the rest, and a fixed
            width/height on next/image stretches a non-square source to
            fit exactly — this letterboxes it within the same 56x56 slot
            instead of distorting it. */}
        <Image src={icon} alt="" fill sizes="56px" className="object-contain" draggable={false} />
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
        className={`win98-app-name text-center pointer-events-none ${isActive ? 'active' : ''}`}
      >
        {label}
      </span>
    </button>
  )
}
