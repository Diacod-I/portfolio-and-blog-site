'use client'

import { useEffect, useState } from 'react'
import ErrorWindow from '@/components/ErrorWindow'

// Create audio instance outside component to persist across renders
let audioInstance: HTMLAudioElement | null = null

export default function NotFound() {
  const [, setMounted] = useState(false)

  // Play audio immediately on mount, don't wait for hydration
  if (typeof window !== 'undefined') {
    if (!audioInstance) {
      audioInstance = new Audio('/win98/windows_error_sound.mp3')
    }
    // Attempt to play immediately (will work after user interaction)
    audioInstance.play().catch(() => {
      // Silently fail if autoplay is blocked
    })
  }

  useEffect(() => {
    setMounted(true)
    
    // Ensure audio plays after hydration
    if (audioInstance) {
      audioInstance.currentTime = 0
      audioInstance.play().catch(err => console.error('Error playing sound:', err))
    }

    return () => {
      if (audioInstance) {
        audioInstance.pause()
      }
    }
  }, [])

  return <ErrorWindow />
}
