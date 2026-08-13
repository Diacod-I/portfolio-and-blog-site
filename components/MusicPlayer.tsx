'use client'

// A tiny Win98 "media player"-style widget shown under a blog post's
// thumbnail (see BlogPostView.tsx) — play/pause, a clickable seek bar, and
// the track name. Purely decorative background music for the post, not a
// podcast player: no volume/queue/etc, just enough to feel like a Win98
// applet without becoming its own app.
//
// Renders nothing if `src` is falsy — most posts won't set a `song` in
// frontmatter, and this component is unconditionally mountable either way.

import { useEffect, useRef, useState } from 'react'

type MusicPlayerProps = {
  src: string | null
  title: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPlayer({ src, title }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  // Pause and reset if the post itself changes out from under us (e.g. the
  // "See also" link swaps to a different post's <MusicPlayer/> instance
  // without a full page reload in some navigation paths).
  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
  }, [src])

  if (!src) return null

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play().catch(() => { /* blocked until a user gesture — this click IS one */ })
    }
    setPlaying(!playing)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const bar = e.currentTarget
    const ratio = (e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth
    audio.currentTime = ratio * duration
    setCurrent(audio.currentTime)
  }

  const progress = duration ? (current / duration) * 100 : 0

  return (
    <div className="win98-app-window flex items-center gap-2 px-2 py-2 mb-6 select-none">
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="win98-button w-8 h-8 flex items-center justify-center shrink-0 text-black text-sm"
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-black text-xs font-bold truncate">{title}</p>
        <div
          onClick={seek}
          className="win98-window-content !p-0 h-3 mt-1 cursor-pointer relative overflow-hidden"
        >
          <div
            className="h-full bg-[#000080]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-black text-[10px] font-bold shrink-0 tabular-nums">
        {formatTime(current)} / {formatTime(duration)}
      </span>
    </div>
  )
}
