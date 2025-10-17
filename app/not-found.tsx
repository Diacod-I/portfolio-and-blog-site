'use client'

import { useEffect, useRef } from 'react'
import ErrorWindow from '@/components/ErrorWindow'

export default function NotFound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Preload the audio file
    audioRef.current = new Audio('/win98/windows_error_sound.mp3')
    audioRef.current.preload = 'auto'

    // Play when component mounts
    const playSound = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.error('Error playing sound:', err))
      }
    }

    // Add a small delay to ensure audio is loaded
    const timer = setTimeout(playSound, 100)

    return () => {
      clearTimeout(timer)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return <ErrorWindow />
}
