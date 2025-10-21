'use client'

import { useEffect } from 'react'
import ErrorWindow from '@/components/ErrorWindow'

export default function NotFound() {
  useEffect(() => {
    // Play the preloaded audio
    const audio = new Audio('/win98/windows_error_sound.mp3')
    audio.play().catch(err => console.error('Error playing sound:', err))

    return () => {
      audio.pause()
    }
  }, [])

  return <ErrorWindow />
}
