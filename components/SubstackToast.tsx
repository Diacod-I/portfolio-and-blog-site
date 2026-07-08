'use client'

// "System tray notification" — now a real app window (see Win98Window)
// instead of a fixed-position toast. Controlled by the parent (HomeClient):
// shown once per session whenever the Blogs window is open on the list view.
//
// It isn't a full taskbar app (see lib/store/windowStore.ts's AppId union,
// same as Credits) since it's a one-off nudge, not a persistent app — there's
// no taskbar slot to minimize to. So minimizing it just dismisses it, same
// as closing; there's nothing dishonest about that trade-off, it just isn't
// pretending to have a taskbar presence it doesn't have.

import { useEffect, useRef, useState } from 'react'
import Win98Window from './Win98Window'

const SUBSTACK_URL = 'https://substack.com/@advithkrishnan'

type Rect = { x: number; y: number; w: number; h: number }

type SubstackToastProps = {
  visible: boolean
  onDismiss: () => void
}

const DEFAULT_W = 340
const DEFAULT_H = 210

export default function SubstackToast({ visible, onDismiss }: SubstackToastProps) {
  const [rect, setRect] = useState<Rect | null>(null)
  const [maximized, setMaximized] = useState(false)
  const preMaximizeRect = useRef<Rect | null>(null)
  // Same <640px breakpoint Win98Window itself uses for "small screen". Real
  // app windows go full-bleed there by design (see Win98Window's defaultInset
  // fallback), which is right for actual apps — but this is a one-off nudge,
  // not an app someone opened on purpose, so a near-fullscreen window for it
  // is the wrong call. On small screens it renders as a small, non-draggable
  // banner pinned to the bottom instead of a Win98Window at all.
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsSmallScreen(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Land it bottom-right, like the old fixed toast, the moment it becomes
  // visible — computed from the actual viewport (not guessed) so it's
  // pixel-accurate at any window size.
  useEffect(() => {
    if (!visible || rect) return
    setRect({
      x: Math.max(16, window.innerWidth - DEFAULT_W - 24),
      y: Math.max(16, window.innerHeight - DEFAULT_H - 90),
      w: DEFAULT_W,
      h: DEFAULT_H,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleToggleMaximize = () => {
    if (maximized) {
      setRect(preMaximizeRect.current)
      setMaximized(false)
    } else {
      preMaximizeRect.current = rect
      setMaximized(true)
    }
  }

  if (!visible) return null

  if (isSmallScreen) {
    return (
      <div
        role="status"
        className="fixed bottom-2 left-2 right-2 z-[9000] win98-window shadow-lg"
      >
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <span>📬 Post Notification</span>
          </div>
          <button
            onClick={onDismiss}
            className="win98-window-button font-bold text-xl"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
        <div className="bg-[#c0c0c0] p-2 flex flex-col gap-2">
          <p className="text-black text-xs">
            <strong>Enjoying the blog?</strong> Get new posts straight to your
            inbox — free, via Substack.
          </p>
          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="win98-button px-3 py-1 font-bold text-black no-underline text-center text-sm"
          >
            Subscribe ✉️
          </a>
        </div>
      </div>
    )
  }

  return (
    <Win98Window
      title="Post Notification"
      icon="/win98/info.webp"
      zIndex={9000}
      minimized={false}
      isFocused
      maximized={maximized}
      defaultInset={{ top: 60, right: 16, bottom: 60, left: 40 }}
      defaultSize={{ w: DEFAULT_W, h: DEFAULT_H }}
      rect={rect}
      onRectChange={setRect}
      onFocus={() => {}}
      onMinimize={onDismiss}
      onToggleMaximize={handleToggleMaximize}
      onClose={onDismiss}
    >
      <div className="win98-window-content bg-[#c0c0c0] p-3 flex flex-col gap-2 flex-1 min-h-0">
        <p className="text-black text-sm">
          <strong>Enjoying the blog?</strong> Get new posts straight to your
          inbox — free, via Substack.
        </p>
        <a
          href={SUBSTACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="win98-button px-4 py-1.5 font-bold text-black no-underline text-center"
        >
          Subscribe ✉️
        </a>
      </div>
    </Win98Window>
  )
}
