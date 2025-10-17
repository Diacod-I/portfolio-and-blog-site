'use client'

import { useEffect, useState } from 'react'

export default function FooterConsole() {
  const [time, setTime] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateTime = () => setTime(new Date().toLocaleTimeString())
    updateTime() // Set initial time
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <footer className="win98-taskbar">
      <button className="win98-start-button">
        <img src="/win98/start.png" alt="Start" className="w-5 h-5" />
        <span className='font-black text-[1.1em]'>Start</span>
      </button>
      <div className="border-l-2 border-[#808080] ml-2 h-8"></div>
      <div className="border-l-2 border-[#ffffff] h-8"></div>
      <div className="flex-1 flex items-center gap-2"></div>
      <div className="border-l-2 border-[#808080] h-8"></div>
      <div className="border-l-2 border-[#ffffff] mr-2 h-8"></div>
      <div className="px-2 win98-taskbar-time">
        <span>{mounted ? time : ''}</span>
      </div>
    </footer>
  )
}
