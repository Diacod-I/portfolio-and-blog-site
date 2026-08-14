'use client'

// A minimal background-music widget shown under a blog post's thumbnail
// (see BlogPostView.tsx) — modeled on buildspace's reader-page player:
// a plain triangle icon, elapsed/total time, and a thin scrubber line with
// a round thumb, all on a dark rounded card. No title/artwork chrome —
// it's meant to fade into the page, not announce itself.
//
// Two modes depending on what a post's `song` frontmatter resolves to
// (see lib/notes.ts):
//
//  - Self-hosted mp3 (`song` is a local path, `songMeta` is null): an
//    <audio> element drives play/pause/seek directly.
//  - YouTube URL (`songMeta` populated via YouTube's public oEmbed at
//    build time): real in-page playback via the official YouTube IFrame
//    Player API, driven by our own button instead of YouTube's — the
//    actual <iframe> the API needs is kept in the DOM (required for it to
//    work at all) but parked off-screen, since we only want the audio.
//
// Renders nothing if the post has no `song` at all.

import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons'
import DitherBackground from '@/components/DitherBackground'
import type { YouTubeSongMeta } from '@/lib/notes'

type MusicPlayerProps = {
  song: string | null
  songTitle: string | null
  songMeta: YouTubeSongMeta | null
  /** Post title — the fallback accessible name for a self-hosted mp3 that
   *  didn't also set `songTitle`. Not shown visually (see file header). */
  postTitle: string
}

// Minimal shape of the bits of the YT IFrame API we actually use — the
// real type comes from a script YouTube injects at runtime, not an npm
// package, so there's nothing to import types from.
type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  mute: () => void
  unMute: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  destroy: () => void
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string
          playerVars?: Record<string, number>
          events?: {
            onReady?: () => void
            onStateChange?: (e: { data: number }) => void
          }
        }
      ) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

// Loaded once per page and shared — if a "See also" widget also renders a
// MusicPlayer, both wait on the same script/promise instead of each
// injecting their own <script> tag.
let youTubeApiPromise: Promise<void> | null = null
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (youTubeApiPromise) return youTubeApiPromise
  youTubeApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return youTubeApiPromise
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Shared chrome for both modes — icon, "current / total" time, and a
// scrubber line with a thumb dot at the playhead.
function PlayerChrome({
  label,
  playing,
  disabled,
  current,
  duration,
  onToggle,
  onSeek,
}: {
  label: string
  playing: boolean
  disabled?: boolean
  current: number
  duration: number
  onToggle: () => void
  onSeek: (ratio: number) => void
}) {
  const progress = duration ? (current / duration) * 100 : 0

  return (
    <div className="relative overflow-hidden rounded-2xl mb-6 select-none">
      {/* Only mounted while actually playing — an idle WebGL context
          sitting there doing nothing would just burn GPU/battery for a
          paused widget nobody's looking at. */}
      {playing && <DitherBackground />}
      <div className="relative z-10 bg-black/35 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onToggle}
          disabled={disabled}
          aria-label={`${playing ? 'Pause' : 'Play'} ${label}`}
          className="text-white hover:text-white transition-colors shrink-0 text-sm leading-none disabled:opacity-40 disabled:hover:text-white"
        >
          <FontAwesomeIcon icon={playing ? faPause : faPlay} fixedWidth />
        </button>
        <span className="text-white text-sm font-mono tabular-nums shrink-0 whitespace-nowrap">
          {formatTime(current)} / {formatTime(duration)}
        </span>
        <div className="relative flex-1 h-4">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/35 rounded-full" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-white rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 w-3 h-3 bg-white rounded-full"
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
          />
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            disabled={disabled || !duration}
            aria-label={`Seek ${label}`}
            onChange={(event) => onSeek(Number(event.currentTarget.value) / 100)}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )
}

export default function MusicPlayer({ song, songTitle, songMeta, postTitle }: MusicPlayerProps) {
  // --- mp3 mode state ---
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  // --- YouTube mode state ---
  const ytHostRef = useRef<HTMLDivElement>(null) // stable, React-owned wrapper — never mutated by the API
  const ytMountRef = useRef<HTMLDivElement | null>(null) // plain node handed to YT.Player, which replaces it with an <iframe>
  const ytPlayerRef = useRef<YTPlayer | null>(null)
  const ytPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // YouTube does not honor HTML audio's preload attribute. Start one muted
  // playback cycle instead, then immediately pause it to warm the stream.
  const ytWarmingRef = useRef(true)
  const [ytReady, setYtReady] = useState(false)
  const [ytPlaying, setYtPlaying] = useState(false)
  const [ytCurrent, setYtCurrent] = useState(0)
  const [ytDuration, setYtDuration] = useState(0)

  // Reset if the post itself changes out from under us (e.g. a "See also"
  // navigation swaps to a different post's MusicPlayer instance).
  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
  }, [song])

  useEffect(() => {
    if (!songMeta) return
    let cancelled = false
    ytWarmingRef.current = true

    loadYouTubeApi().then(() => {
      if (cancelled || !ytHostRef.current || !window.YT) return
      // The IFrame API doesn't render *inside* the element you hand it —
      // it destructively replaces that element with an <iframe>. Handing
      // it ytHostRef.current directly would mean replacing a node React
      // itself rendered and still believes exists; React later tries to
      // remove/reconcile that now-gone node and throws a `removeChild`
      // NotFoundError. Give the API a plain node React never put in its
      // own tree instead — ytHostRef stays an untouched, stable wrapper.
      const mount = document.createElement('div')
      ytHostRef.current.appendChild(mount)
      ytMountRef.current = mount

      ytPlayerRef.current = new window.YT.Player(mount, {
        videoId: songMeta.id,
        // Muted autoplay is allowed by modern browsers; it lets YouTube
        // initialize and buffer before the visitor presses Play.
        playerVars: { playsinline: 1, autoplay: 1, mute: 1 },
        events: {
          onReady: () => setYtReady(true),
          onStateChange: (e) => {
            if (e.data === 1 && ytWarmingRef.current) {
              ytWarmingRef.current = false
              ytPlayerRef.current?.pauseVideo()
              ytPlayerRef.current?.unMute()
              return
            }
            setYtPlaying(e.data === 1 /* YT.PlayerState.PLAYING */)
          },
        },
      })
    })

    return () => {
      cancelled = true
      if (ytPollRef.current) clearInterval(ytPollRef.current)
      // destroy() removes the <iframe> that replaced our mount node. If
      // cleanup runs before the API even loaded, that swap never happened
      // — fall back to removing the still-plain mount node ourselves.
      ytPlayerRef.current?.destroy()
      ytPlayerRef.current = null
      if (ytMountRef.current?.parentNode) {
        ytMountRef.current.parentNode.removeChild(ytMountRef.current)
      }
      ytMountRef.current = null
      setYtReady(false)
      setYtPlaying(false)
      setYtCurrent(0)
      setYtDuration(0)
    }
  }, [songMeta?.id])

  // Poll for playhead position while playing — the IFrame API is
  // event-driven for state changes but not for progress, same reason
  // <audio> needs its own onTimeUpdate handler.
  useEffect(() => {
    if (!ytPlaying) return
    ytPollRef.current = setInterval(() => {
      const player = ytPlayerRef.current
      if (!player) return
      setYtCurrent(player.getCurrentTime())
      setYtDuration(player.getDuration())
    }, 400)
    return () => {
      if (ytPollRef.current) clearInterval(ytPollRef.current)
    }
  }, [ytPlaying])

  if (!song) return null

  if (songMeta) {
    const toggleYt = () => {
      const player = ytPlayerRef.current
      if (!player) return
      if (ytPlaying) player.pauseVideo()
      else player.playVideo()
    }

    return (
      <>
        {/* The IFrame API needs a real element to mount into — parked
            off-screen since we only want its audio, not YouTube's own
            video chrome. */}
        <div
          ref={ytHostRef}
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', left: -9999 }}
        />
        <PlayerChrome
          label={songTitle ?? songMeta.title}
          playing={ytPlaying}
          disabled={!ytReady}
          current={ytCurrent}
          duration={ytDuration}
          onToggle={toggleYt}
          onSeek={(ratio) => {
            const player = ytPlayerRef.current
            if (!player || !ytDuration) return
            const target = ratio * ytDuration
            player.seekTo(target, true)
            setYtCurrent(target)
          }}
        />
      </>
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

  return (
    <>
      <audio
        ref={audioRef}
        src={song}
        // Ask the browser to buffer the track as soon as this post renders,
        // reducing the delay on the first user-initiated play. Browsers may
        // still limit this on data-saver or constrained-network connections.
        preload="auto"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />
      <PlayerChrome
        label={songTitle ?? postTitle}
        playing={playing}
        current={current}
        duration={duration}
        onToggle={toggle}
        onSeek={(ratio) => {
          const audio = audioRef.current
          if (!audio || !duration) return
          audio.currentTime = ratio * duration
          setCurrent(audio.currentTime)
        }}
      />
    </>
  )
}
