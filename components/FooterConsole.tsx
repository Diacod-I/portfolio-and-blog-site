'use client'

import { useEffect, useState } from 'react'

interface FooterConsoleProps {
  activeApps?: { id: string; name: string; icon: string; isActive: boolean }[]
  onAppClick?: (id: string) => void
}

export default function FooterConsole({ 
  activeApps = [], 
  onAppClick = () => {} 
}: FooterConsoleProps) {
  const [time, setTime] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateTime = () => setTime(new Date().toLocaleTimeString())
    updateTime() // Set initial time
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Close start menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.win98-start-button') && !target.closest('.win98-start-menu')) {
        setIsStartMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <footer className="win98-taskbar">
      <div className="relative">
        <button 
          className={`win98-start-button ${isStartMenuOpen ? 'active' : ''}`}
          onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
        >
          <img src="/win98/start.webp" alt="Start Button Icon" className="w-5 h-5" />
          <span className='font-black text-[1.1em]'>Start</span>
        </button>

        {isStartMenuOpen && (
          <div className="win98-start-menu absolute bottom-full left-0 mb-1 w-64 bg-[#c0c0c0] border-2 border-white border-r-black border-b-transparent">
            <div className="bg-[#000080] absolute left-0 top-0 bottom-0 w-[23px]"></div>
            <div className="flex flex-col py-2 pl-[18px]">
              <button className="win98-start-menu-item flex items-center px-4 py-1 min-w-0">
                <img src="/win98/notepad.webp" alt="Documents" className="w-8 h-8 mr-3" />
                <span>Documents</span>
              </button>
              <button className="win98-start-menu-item flex items-center px-4 py-1 min-w-0">
                <img src="/win98/photos.webp" alt="Pictures" className="w-8 h-8 mr-3" />
                <span>Pictures</span>
              </button>
              <div className="border-t border-[#808080] my-2"></div>
              <button className="win98-start-menu-item flex items-center px-4 py-1 min-w-0">
                <img src="/win98/internet.webp" alt="Internet" className="w-8 h-8 mr-3" />
                <span>Internet</span>
              </button>
              <div className="border-t border-[#808080] my-2"></div>
              <button className="win98-start-menu-item flex items-center px-4 py-1 min-w-0">
                <img src="/win98/info.webp" alt="About" className="w-8 h-8 mr-3" />
                <span>About</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-l-2 border-[#808080] ml-2 h-8"></div>
      <div className="border-l-2 border-[#ffffff] h-8 mr-2"></div>
      <div className="flex-1 flex items-center gap-2">
        {activeApps.map((app) => (
          <button
            key={app.id}
            onClick={() => onAppClick(app.id)}
            className={`win98-button flex items-center gap-2 px-2 py-1 min-w-[150px] ${
              app.isActive 
                ? 'bg-[#c3c3c3] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white' 
                : ''
            }`}
          >
            <img src={app.icon} alt={app.name+" Icon"} className="w-4 h-4" />
            <span className="text-xs font-bold">{app.name}</span>
          </button>
        ))}
      </div>
      <div className="border-l-2 border-[#808080] h-8"></div>
      <div className="border-l-2 border-[#ffffff] mr-2 h-8"></div>
      <div className="px-2 win98-taskbar-time">
        <span>{mounted ? time : ''}</span>
      </div>
    </footer>
  )
}
