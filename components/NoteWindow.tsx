'use client'

import { useRouter } from 'next/navigation'

interface NoteWindowProps {
  title: string
  children: React.ReactNode
}

export default function NoteWindow({ title, children }: NoteWindowProps) {
  const router = useRouter()

  return (
    <div 
      className="h-screen p-4 pb-16 overflow-hidden"
      style={{
        backgroundImage: 'url(/win98/windows_98_wallpaper.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="win98-window min-h-min max-h-full flex flex-col">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <img src="/win98/notes.webp" alt="Notes" className="w-4 h-4" />
            <span>{title}</span>
          </div>
          <div className="flex gap-1">
            <button 
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/?app=open')}
            >
              ↩
            </button>
            <button 
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/')}
            >×</button>
          </div>
        </div>
        <div className="win98-window-content bg-[#222222] text-white p-4 max-h-[calc(100vh-150px)] overflow-y-auto">
          {children}
        </div>
      </div>
      <div className="mt-8 text-center text-[11px] text-[#ffffff] font-mono opacity-70">
        © 2025 Advith Krishnan. <a href="/LICENSE.md" className="hover:underline">CC BY-NC-ND 4.0</a>. <a href="/credits" className="text-[11px] text-[#ffffff] font-mono hover:underline">Credits & attributions provided.</a>
      </div>
    </div>
  )
}
