'use client'

import { useRouter } from 'next/navigation'
import RecentNotes from '@/components/RecentNotes'

// TODO: Work on Search Feature for All Blogs

export default function BlogsUnifiedPage() {
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
            <img src="/win98/notepad.webp" alt="Blogs" className="w-4 h-4" />
            <span>All Blog Posts</span>
          </div>
          <div className="flex gap-1">
            <button 
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/?app=open')}
            >↩</button>
            <button 
              className="win98-window-button font-bold text-2xl"
              onClick={() => router.push('/')}
            >×</button>
          </div>
        </div>
        <div className="win98-window-content bg-[#222222] p-4 max-h-[calc(100vh-150px)] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold mb-4 mt-12 text-white text-center tracking-tight drop-shadow">All Blog Posts</h1>
            <p className="mb-6 text-white text-md text-center opacity-80">
              Browse all my recent and older blog posts in one place. Click any post to read more.
            </p>
            <div className="py-0">
              <RecentNotes showAll={true} className="gap-y-3 p-2" />
            </div>
            <hr className="my-8 border-gray-500 opacity-60" />
            <p className="text-center mt-6 text-gray-400 italic">More coming soon....</p>
          </div>
        </div>
      </div>
    </div>
  )
}
