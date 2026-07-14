'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function ErrorWindow() {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Shake once on arrival, same authentic "an error just happened" read a
  // real Windows dialog gives you — runs immediately, independent of audio.
  const [shake, setShake] = useState(true)

  useEffect(() => {
    const audio = new Audio('/win98/windows_error_sound.mp3')
    audioRef.current = audio

    let played = false
    const tryPlay = () => {
      if (played) return
      audio.currentTime = 0
      audio.play().then(() => { played = true }).catch(() => { /* still blocked, see below */ })
    }

    // Real Windows plays the chime the instant the dialog appears. Try that
    // first — it only succeeds here if the browser already considers this
    // tab "activated" (e.g. the user clicked a link elsewhere on the site to
    // get here), which is common for in-app 404s.
    tryPlay()

    // Every major browser blocks audio-with-sound autoplay until the user
    // has interacted with the page at all — that's a hard browser policy,
    // not something fixable from JS. So as a fallback, fire on the very
    // first interaction of *any* kind, anywhere on the page (not just a
    // click inside the dialog — keyboard and touch count too), so the sound
    // lands as close to "arrival" as the browser will allow.
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart']
    events.forEach(ev => window.addEventListener(ev, tryPlay, { once: true }))

    const shakeTimer = setTimeout(() => setShake(false), 400)

    return () => {
      events.forEach(ev => window.removeEventListener(ev, tryPlay))
      clearTimeout(shakeTimer)
      audio.pause()
      audioRef.current = null
    }
  }, [])

  return (
    <div
      className="h-screen p-4 pb-16 overflow-hidden"
      style={{
        backgroundImage: 'url(/win98/windows_98_wallpaper.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className={`win98-window max-w-md mx-auto mt-20 ${shake ? 'win98-error-shake' : ''}`}>
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <span>Error 404</span>
          </div>
          <div className="flex gap-1">
            <button 
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('')}
            >×</button>
          </div>
        </div>
        <div className="win98-window-content p-6">
          <div className="flex items-start gap-4">
            <Image src="/win98/error.webp" alt="Error" width={32} height={32} className="w-8 h-8" />
            <div>
              <h2 className="font-bold mb-4">Page Not Found</h2>
              <p className="mb-6">The requested page could not be found. Click 'OK' to return to Home.</p>
              <div className="flex justify-end">
                <button
                  onClick={() => router.push('/')}
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
