'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function WindowsLoader() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    },400)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="win98-window fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-[200px]">
      <div className="win98-titlebar">
        <div className="flex items-center gap-2">
          <Image src="/win98/info.webp" alt="Loading" className="w-4 h-4" />
          <span>Loading..</span>
        </div>
      </div>
      <div className="p-4 bg-[#c0c0c0] flex items-center gap-4">
        <div className="animate-spin border-4 border-[#000080] border-t-transparent rounded-full w-8 h-8"></div>
        <span>Loading advith_krishnan.exe...</span>
      </div>
    </div>
  )
}
