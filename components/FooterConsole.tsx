'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Image from 'next/image'
import { Reorder } from 'framer-motion'
import BatteryIndicator from '@/components/BatteryIndicator'

export type TaskbarApp = {
  id: string
  name: string
  icon: string
  /** true when the app is open and focused (pressed-in button) */
  isActive: boolean
}

interface FooterConsoleProps {
  /** Apps with a taskbar presence (open or minimized), in user order */
  activeApps?: TaskbarApp[]
  /** Click: minimize if focused, restore+focus otherwise */
  onAppClick?: (id: string) => void
  /** Drag-to-reorder taskbar buttons */
  onReorder?: (ids: string[]) => void
  /** Opens the Credits app window (not a page navigation — see HomeClient) */
  onCreditsClick?: () => void
}

export default function FooterConsole({
  activeApps = [],
  onAppClick = () => {},
  onReorder = () => {},
  onCreditsClick,
}: FooterConsoleProps) {
  const [time, setTime] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false)
  // True while a taskbar button is being dragged (and for one tick after,
  // so the click that fires on release is suppressed but the next one isn't)
  const isDragging = useRef(false)

  // Real Windows taskbars shrink buttons down to icon-only before ever
  // scrolling — same idea here. Measure the app-buttons region's own
  // rendered width (ResizeObserver, same pattern as ExplorerBlogList's
  // `compact` mode: a Tailwind breakpoint tracks the *viewport*, not this
  // flex child, so it can't drive this) and, once there's less than
  // ~90px of room per open app, drop every button's text label and let
  // them render as plain icon squares instead.
  const appsRegionRef = useRef<HTMLDivElement>(null)
  const [appsRegionWidth, setAppsRegionWidth] = useState(0)

  useEffect(() => {
    const el = appsRegionRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setAppsRegionWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const compactApps = useMemo(
    () => activeApps.length > 0 && appsRegionWidth > 0 && appsRegionWidth / activeApps.length < 90,
    [activeApps.length, appsRegionWidth]
  )

  useEffect(() => {
    setMounted(true)
    const updateTime = () => setTime(new Date().toLocaleTimeString())
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Close start menu when clicking outside
  useEffect(() => {
    if (!isStartMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.win98-start-button') && !target.closest('.win98-start-menu')) {
        setIsStartMenuOpen(false)
      }
    }

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isStartMenuOpen])

  // Close the info/credits tray popup when clicking outside — same pattern
  // as the Start menu above.
  useEffect(() => {
    if (!isInfoPopupOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.win98-info-button') && !target.closest('.win98-info-popup')) {
        setIsInfoPopupOpen(false)
      }
    }

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isInfoPopupOpen])

  const toggleStartMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsStartMenuOpen(prev => !prev)
  }

  const handleAppClick = (id: string) => {
    if (isDragging.current) return
    onAppClick(id)
  }

  return (
    <footer className="win98-taskbar">
      <div className="flex items-center w-full min-w-0">
        {/* Start Button - Always visible */}
        <div className="relative flex-shrink-0 mr-2">
          <button
            className={`win98-start-button ${isStartMenuOpen ? 'active' : ''}`}
            onClick={toggleStartMenu}
            type="button"
          >
            <Image src="/win98/start.webp" alt="Start Button Icon" width={20} height={20} className="w-5 h-5" />
            <span className='font-black text-[1.1em]'>Start</span>
          </button>

          {isStartMenuOpen && (
            <div
              className="win98-start-menu absolute z-99999 bottom-full left-0 mb-1 w-64 bg-[#c0c0c0] border-2 border-white border-r-black border-b-transparent"
              style={{ zIndex: 99999 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#000080] absolute left-0 top-0 bottom-0 w-[23px]"></div>
              <div className="flex flex-col py-2 pl-[18px]">
                <div className="flex items-center justify-center">
                  <Image
                    src="/club_penguin.gif"
                    alt="Club Penguin Dancing"
                    width={192} height={80}
                    className="w-48 h-auto"
                  />
                </div>
                <p className="ml-2 text-center text-sm font-semibold">
                  Hope you are having a great day! :)
                </p>
                {/* Credits & Licenses used to also be linked from here, but
                    that's now the tray-style info button at the other end
                    of the taskbar (see below) — one entry point instead of
                    two, and that one works on every screen size. */}
              </div>
            </div>
          )}
        </div>

        {/* App buttons: drag to reorder, click to minimize/restore */}
        <div ref={appsRegionRef} className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
          <Reorder.Group
            axis="x"
            values={activeApps.map((a) => a.id)}
            onReorder={onReorder}
            className="flex items-center gap-2 min-w-max pr-2 list-none m-0 p-0"
          >
            {activeApps.map((app) => (
              <Reorder.Item
                key={app.id}
                value={app.id}
                // Reorder.Item defaults to a full `layout` animation (size
                // *and* position), meant for smoothly sliding buttons past
                // each other on drag. Without pinning it down to "position"
                // only, toggling compactApps — which changes every button's
                // width at once — made that same spring tween stretch/snap
                // each button's width instead of just hiding the label.
                layout="position"
                onDragStart={() => { isDragging.current = true }}
                onDragEnd={() => {
                  // Let the release-click fire (and be suppressed) first
                  setTimeout(() => { isDragging.current = false }, 50)
                }}
                whileDrag={{ scale: 1.05, zIndex: 60 }}
                className="list-none relative"
                style={{ touchAction: 'none' }}
              >
                <button
                  onClick={() => handleAppClick(app.id)}
                  title={compactApps ? app.name : undefined}
                  className={`win98-button flex items-center gap-2 py-1 flex-shrink-0 select-none ${
                    compactApps ? 'justify-center w-9 px-0' : 'px-2 min-w-[120px]'
                  } ${
                    app.isActive
                      ? 'bg-[#c3c3c3] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white'
                      : ''
                  }`}
                >
                  <Image
                    src={app.icon}
                    alt=""
                    width={16}
                    height={16}
                    className="w-4 h-4 pointer-events-none object-contain shrink-0"
                    draggable={false}
                  />
                  {!compactApps && (
                    <span className="text-xs font-bold truncate pointer-events-none">{app.name}</span>
                  )}
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        {/* Info/credits tray button — a fixed-size icon instead of the old
            always-visible copyright line, which had to defensively shrink
            and truncate to survive a crowded taskbar (and still ended up
            looking broken once buttons crowded it — see the separators
            that used to sit here). Same idea as a real OS's system tray
            "show hidden icons" expander: click reveals a small popup
            instead of permanently spending bar space on text. Also now the
            only place Credits & Licenses is reachable from the taskbar —
            it used to be duplicated in the Start menu above. */}
        <div className="relative ml-auto flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsInfoPopupOpen((prev) => !prev)
            }}
            aria-label="Copyright and credits"
            aria-expanded={isInfoPopupOpen}
            className={`win98-info-button win98-button w-7 h-7 flex items-center justify-center ${
              isInfoPopupOpen
                ? 'border-t-[#808080] border-l-[#808080] border-b-white border-r-white'
                : ''
            }`}
          >
            <Image src="/win98/info.webp" alt="" width={16} height={16} className="w-4 h-4" />
          </button>

          {isInfoPopupOpen && (
            <div
              className="win98-info-popup absolute z-[99999] bottom-full right-0 mb-1 w-56 bg-[#c0c0c0] border-2 border-white border-r-black border-b-black p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-black text-xs font-mono">
                © 2024-{new Date().getFullYear()} Advith Krishnan
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsInfoPopupOpen(false)
                  onCreditsClick?.()
                }}
                className="win98-button w-full mt-2 px-2 py-1 text-xs font-bold text-black"
              >
                Credits &amp; Licenses
              </button>
            </div>
          )}
        </div>
        {/* Battery + Clock share one sunken tray box, battery first. The
            battery reading (real, via the Battery Status API) renders
            nothing when the browser doesn't support it — see that
            component — so this box quietly falls back to just the clock. */}
        <div className="ml-2 px-2 win98-taskbar-time flex-shrink-0 flex items-center gap-2">
          {mounted && <BatteryIndicator />}
          <span className="text-xs whitespace-nowrap">{mounted ? time : ''}</span>
        </div>
      </div>
    </footer>
  )
}
