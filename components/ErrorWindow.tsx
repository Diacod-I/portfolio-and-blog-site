'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Image from 'next/image'

export default function ErrorWindow() {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element once
    audioRef.current = new Audio('/win98/windows_error_sound.mp3')
    
    // Try to play (will work if user navigated from within site)
    audioRef.current.play().catch(() => {
      // Silent fail if blocked - user will trigger it by clicking anyway
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleClick = () => {
    // Play sound on any click if it hasn't played yet
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  return (
    <div 
      className="h-screen p-4 pb-16 overflow-hidden"
      onClick={handleClick}
      style={{
        backgroundImage: 'url(/win98/windows_98_wallpaper.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="win98-window max-w-md mx-auto mt-20">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <span>Error</span>
          </div>
          <div className="flex gap-1">
            <button 
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/')}
            >×</button>
          </div>
        </div>
        <div className="win98-window-content p-6">
          <div className="flex items-start gap-4">
            <Image src="/win98/error.webp" alt="Error" className="w-8 h-8" />
            <div>
              <h2 className="font-bold mb-4">Page Not Found</h2>
              <p className="mb-6">The requested page could not be found. Click 'OK' to return to Home.</p>
              <div className="flex justify-end">
                <button 
                  onClick={() => router.push('/?app=open')}
                  className="win98-button px-6"
                >
                  <span className="font-bold">OK</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
