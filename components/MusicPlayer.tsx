'use client'

// A tiny Win98 "media player"-style widget shown under a blog post's
// thumbnail (see BlogPostView.tsx). Two modes depending on what a post's
// `song` frontmatter resolves to (see lib/notes.ts):
//
//  - Self-hosted mp3 (`song` is a local path, `songMeta` is null): true
//    in-page playback — play/pause, a clickable seek bar, elapsed time.
//  - YouTube URL (`songMeta` populated via YouTube's public oEmbed at
//    build time): YouTube doesn't offer a way to stream a full track into
//    a custom player without their own SDK/branding, so this shows the
//    fetched title/artist/thumbnail in our own UI and links out to
//    actually play it on YouTube.
//
// Renders nothing if the post has no `song` at all.

import { useEffect, useRef, useState } from 'react'
import type { YouTubeSongMeta } from '@/lib/notes'

type MusicPlayerProps = {
  song: string | null
  songTitle: string | null
  songMeta: YouTubeSongMeta | null
  /** Post title — the fallback display name for a self-hosted mp3 that
   *  didn't also set `songTitle`. */
  postTitle: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPlayer({ song, songTitle, songMeta, postTitle }: MusicPlayerProps) {
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
  }, [song])

  if (!song) return null

  if (songMeta) {
    return (
      <a
        href={songMeta.url}
        target="_blank"
        rel="noopener noreferrer"
        className="win98-app-window flex items-center gap-2 px-2 py-2 mb-6 select-none no-underline hover:bg-[#d5d5d5] transition-colors"
      >
        {songMeta.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- external YouTube CDN thumbnail, not worth allowlisting in next.config for one component
          <img
            src={songMeta.thumbnail}
            alt=""
            className="w-10 h-10 object-cover border-2 border-[#808080] shrink-0"
          />
        ) : (
          <span className="win98-button w-10 h-10 flex items-center justify-center shrink-0 text-black">▶</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-black text-xs font-bold truncate">{songTitle ?? songMeta.title}</p>
          {songMeta.author && <p className="text-black/70 text-[10px] truncate">{songMeta.author}</p>}
        </div>
        <span className="win98-button px-2 py-1 shrink-0 text-black text-[10px] font-bold">
          ▶ YouTube
        </span>
      </a>
    )
  }

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
        src={song}
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
        <p className="text-black text-xs font-bold truncate">{songTitle ?? postTitle}</p>
        <div
          onClick={seek}
          className="win98-window-content !p-0 h-3 mt-1 cursor-pointer relative overflow-hidden"
        >
          <div className="h-full bg-[#000080]" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className="text-black text-[10px] font-bold shrink-0 tabular-nums">
        {formatTime(current)} / {formatTime(duration)}
      </span>
    </div>
  )
}
