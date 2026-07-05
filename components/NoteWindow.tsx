'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface NoteWindowProps {
  title: string
  children: React.ReactNode
  /** Optional status bar fields (shown in the window's bottom edge) */
  date?: string
  readingTimeMinutes?: number
  author?: string
}

export default function NoteWindow({
  title,
  children,
  date,
  readingTimeMinutes,
  author,
}: NoteWindowProps) {
  const router = useRouter()

  const statusParts = [
    date && new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    readingTimeMinutes && `${readingTimeMinutes} min read`,
    author,
  ].filter(Boolean)

  return (
    <div
      className="h-screen p-4 overflow-hidden"
      style={{
        backgroundImage: 'url(/win98/windows_98_wallpaper.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="win98-window min-h-min max-h-full flex flex-col">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <Image src="/win98/notes.webp" alt="" width={20} height={20} className="w-4 h-4" />
            <span>{title}</span>
          </div>
          <div className="flex gap-1">
            <button
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/?app=open')}
              aria-label="Back to desktop"
            >
              ↩
            </button>
            <button
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/')}
              aria-label="Close"
            >×</button>
          </div>
        </div>
        <div className="win98-window-content bg-[#222222] text-white p-4 max-h-[calc(105vh-190px)] overflow-y-auto">
          {children}
        </div>
        {/* Status bar: anchored to the window, so short pages no longer show
            floating footer text over the wallpaper */}
        <div className="flex flex-wrap items-center justify-between bg-[#c0c0c0] border-t-2 border-[#dfdfdf] px-2 py-0.5 text-black text-xs gap-x-4">
          <span>{statusParts.join(' · ') || 'Ready'}</span>
          <span className="text-right">
            © 2025 Advith Krishnan ·{' '}
            <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" className="hover:underline">
              CC BY-NC-ND 4.0
            </a>{' '}
            ·{' '}
            <a href="/credits" className="hover:underline">
              Credits
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}
