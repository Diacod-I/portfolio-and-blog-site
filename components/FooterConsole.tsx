'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Reorder } from 'framer-motion'

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
  // True while a taskbar button is being dragged (and for one tick after,
  // so the click that fires on release is suppressed but the next one isn't)
  const isDragging = useRef(false)

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
        <div className="relative flex-shrink-0">
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
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-l-2 border-[#808080] ml-2 h-8 flex-shrink-0"></div>
        <div className="border-l-2 border-[#ffffff] h-8 mr-2 flex-shrink-0"></div>

        {/* App buttons: drag to reorder, click to minimize/restore */}
        <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
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
                  className={`win98-button flex items-center gap-2 px-2 py-1 min-w-[120px] flex-shrink-0 select-none ${
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
                    className="w-4 h-4 pointer-events-none"
                    draggable={false}
                  />
                  <span className="text-xs font-bold truncate pointer-events-none">{app.name}</span>
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
        {/* Copyright notice */}
        <p className="ml-auto px-2 text-[11px] text-[#444] font-mono opacity-70 hidden md:block">
          © 2025 Advith Krishnan. <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noopener noreferrer" className="hover:underline">CC BY-NC-ND 4.0</a>. <button type="button" onClick={onCreditsClick} className="text-[11px] text-[#444] font-mono hover:underline">Credits & attributions provided.</button>
        </p>

        {/* Separator */}
        <div className="border-l-2 border-[#808080] h-8 flex-shrink-0"></div>
        <div className="border-l-2 border-[#ffffff] mr-2 h-8 flex-shrink-0"></div>

        {/* Clock - Always visible */}
        <div className="px-2 win98-taskbar-time flex-shrink-0">
          <span className="text-xs whitespace-nowrap">{mounted ? time : ''}</span>
        </div>
      </div>
    </footer>
  )
}
